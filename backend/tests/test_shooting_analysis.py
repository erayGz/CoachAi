import asyncio
from dataclasses import replace
from io import BytesIO
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch

import cv2
from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers

from app.main import analyze_shooting
from app.models import VideoMetadata
from app.shot_detection import ShotContact, UnscorableShotError, _unique_foot_crossing, find_single_contact, measure_shot
from app.shot_recovery import _candidate_regions, _flight_regions, _foot_regions
from app.shot_tracking import track_local_contact
from app.shot_vision import Ball, FrameObservation, ShotVisionError, _observe_frame
from app.video_processing import VideoTimeline, extract_video_timeline


def observations(strikes=(45,), with_ball=True, with_support_foot=True, people=1):
    frames = []
    for index in range(120):
        contact = min(strikes, key=lambda strike: abs(index - strike))
        offset = index - contact
        kick_x = 0.44 if offset < 0 else 0.535 + min(offset, 9) * 0.008
        joints = [None] * 33
        joints[11], joints[12] = (0.48, 0.18), (0.50, 0.18)
        joints[23], joints[24] = (0.46, 0.335), (0.48, 0.335)
        if with_support_foot:
            joints[27], joints[29], joints[31] = (0.46, 0.48), (0.45, 0.50), (0.49, 0.50)
        joints[28], joints[32] = (kick_x, 0.49), (kick_x + 0.004, 0.49)
        balls = (Ball((0.54 + max(0, min(offset, 9)) * 0.03, 0.49), 0.012),) if with_ball else ()
        count = people if 2 <= abs(offset) <= 6 else 1
        frames.append(FrameObservation(index, index / 30, tuple(joints) if count == 1 else (), balls, count, 0.9))
    return frames


def upload() -> UploadFile:
    return UploadFile(BytesIO(b"fixture"), filename="shot.mp4", headers=Headers({"content-type": "video/mp4"}))


class ShotDetectionTests(unittest.TestCase):
    def test_detects_contact_and_returns_three_measurements(self):
        frames = observations()
        shot = find_single_contact(frames)
        measured = measure_shot(frames, shot)
        self.assertEqual(measured.kickingFoot, "right")
        self.assertAlmostEqual(measured.contactTimeSeconds, 1.5, delta=0.04)
        self.assertAlmostEqual(measured.plantFootDistanceTorsoLengths, 0.45, delta=0.02)
        self.assertGreater(measured.torsoTiltDegrees, 0)
        self.assertGreater(measured.followThroughTorsoLengths, 0.30)

    def test_leaves_obscured_support_foot_unmeasured(self):
        frames = observations(with_support_foot=False)
        measured = measure_shot(frames, find_single_contact(frames))
        self.assertIsNone(measured.plantFootDistanceTorsoLengths)
        self.assertIsNotNone(measured.followThroughTorsoLengths)

    def test_rejects_shot_without_a_ball(self):
        with self.assertRaisesRegex(UnscorableShotError, "ball was not detected"):
            find_single_contact(observations(with_ball=False))

    def test_accepts_ball_already_rolling_before_contact(self):
        frames = observations()
        for index in range(45):
            frame = frames[index]
            frames[index] = replace(frame, balls=(Ball((0.54 + (index - 45) * 0.003, 0.49), 0.012),))
        self.assertAlmostEqual(find_single_contact(frames).time, 1.5, delta=0.04)

    def test_accepts_one_departure_sample_when_ball_clearly_exits(self):
        for exit_x, expected_exit in ((0.96, True), (0.82, False)):
            with self.subTest(exit_x=exit_x):
                frames = observations()
                for index, frame in enumerate(frames):
                    joints = tuple((point[0] + 0.13, point[1]) if point is not None else None for point in frame.joints)
                    balls = ()
                    if index <= 46:
                        balls = (Ball((0.67 if index < 46 else exit_x, 0.49), 0.012),)
                    frames[index] = replace(frame, joints=joints, balls=balls)
                if expected_exit:
                    contact = find_single_contact(frames)
                    self.assertTrue(contact.limited_ball_track)
                    self.assertAlmostEqual(contact.time, 1.5, delta=0.04)
                    self.assertIsNone(measure_shot(frames, contact).followThroughTorsoLengths)
                    for index, frame in enumerate(frames):
                        joints = list(frame.joints)
                        joints[28] = joints[32] = (0.67, 0.49)
                        frames[index] = replace(frame, joints=tuple(joints))
                with self.assertRaisesRegex(UnscorableShotError, "could not verify"):
                    find_single_contact(frames)

    def test_ignores_two_balls_that_never_move(self):
        balls = (Ball((0.54, 0.49), 0.012), Ball((0.80, 0.49), 0.012))
        frames = [replace(frame, balls=balls) for frame in observations()]
        with self.assertRaisesRegex(UnscorableShotError, "could not verify how the ball moved"):
            find_single_contact(frames)

    def test_selects_the_last_contact_between_two_balls(self):
        frames = []
        first = observations(strikes=(30,))
        second = observations(strikes=(90,))
        for earlier, later in zip(first, second):
            other = later.balls[0]
            second_ball = replace(other, center=(other.center[0] - 0.24, other.center[1]))
            joints = earlier.joints
            if earlier.index >= 60:
                joints = tuple((point[0] - 0.24, point[1]) if point else None for point in later.joints)
            frames.append(replace(earlier, joints=joints, balls=(*earlier.balls, second_ball)))
        hit = find_single_contact(frames)
        self.assertAlmostEqual(hit.time, 3, delta=0.04)
        self.assertAlmostEqual(hit.ball.center[0], 0.30, delta=0.02)

    def test_local_recovery_can_link_a_consistent_flight_after_missing_frames(self):
        flight = {47: (0.575, 0.49), 50: (0.621, 0.526), 51: (0.637, 0.533)}
        frames = [replace(frame, balls=(Ball(flight[frame.index], 0.012, 0.12),) if frame.index in flight else ())
                  if frame.index >= 45 else frame for frame in observations()]
        with self.assertRaises(UnscorableShotError):
            find_single_contact(frames)
        hit = find_single_contact(frames, recover_flight=True)
        self.assertAlmostEqual(hit.time, 1.5, delta=0.06)
        self.assertEqual(hit.foot, "right")
        self.assertTrue(hit.limited_ball_track)
        self.assertIsNone(measure_shot(frames, hit).followThroughTorsoLengths)

        # A candidate flying nearby cannot validate contact if the original ball is still visible at rest.
        with_static_ball = [replace(frame, balls=(Ball((0.54, 0.49), 0.012), *frame.balls)) if frame.index >= 45 else frame
                            for frame in frames]
        with self.assertRaises(UnscorableShotError):
            find_single_contact(with_static_ball, recover_flight=True)

    def test_links_motion_after_a_detection_gap_without_adopting_a_spare_ball(self):
        spare = Ball((0.82, 0.53), 0.012)
        frames = []
        for frame in observations()[33:57]:
            balls = (spare,)
            if frame.index <= 43:
                balls += frame.balls
            elif frame.index >= 47:
                balls += (replace(frame.balls[0], confidence=0, motion_only=True),)
            frames.append(replace(frame, balls=balls))
        contact = track_local_contact(frames, 1.5)
        self.assertIsNotNone(contact)
        self.assertAlmostEqual(contact.time, 1.5, delta=0.04)
        self.assertEqual(contact.foot, "right")
        self.assertEqual(contact.ball.center, (0.54, 0.49))
        self.assertTrue(contact.limited_ball_track)
        without_seed = [replace(frame, balls=tuple(ball for ball in frame.balls
                                                 if ball.motion_only or ball == spare)) for frame in frames]
        self.assertIsNone(track_local_contact(without_seed, 1.5))

    def test_outgoing_ball_seeds_a_shooter_crop_when_wide_pose_is_missing(self):
        frames = [replace(frame, joints=(), person_count=0) for frame in observations()[48:54]]
        regions = _flight_regions(frames)
        self.assertTrue(any(region.start < 1.5 < region.end for region, _ in regions))

    def test_local_crossing_retains_contact_time_and_uses_nearby_complete_pose(self):
        frames = observations()[44:47]
        exact = frames[1]
        joints = list(exact.joints)
        joints[29] = joints[31] = None
        frames[1] = replace(exact, joints=tuple(joints))
        crossing = ShotContact(1.498, "right", frames[1], exact.balls[0], (1, 0), "occluded")
        with patch("app.shot_detection._interpolated_foot", side_effect=[None, (0.1, crossing)]):
            _, hit = _unique_foot_crossing(frames, 1.48, 1.52, crossing.ball, crossing.direction)
        self.assertEqual(hit.time, crossing.time)
        self.assertEqual(hit.frame.index, 44)
        self.assertIsNotNone(measure_shot(frames, hit).plantFootDistanceTorsoLengths)

    def test_foot_motion_seeds_a_rescan_without_a_top_candidate(self):
        frames = observations(with_ball=False)
        self.assertEqual(_candidate_regions(frames), [])
        regions = _foot_regions(frames)
        self.assertTrue(any(region.start < 1.5 < region.end for region, _ in regions))
        with self.assertRaises(UnscorableShotError):
            find_single_contact(frames, recover_flight=True)

    def test_merges_two_pose_estimates_over_the_same_feet(self):
        def pose(offset):
            return [SimpleNamespace(x=0.45 + offset, y=0.60, visibility=0.9) for _ in range(33)]

        same_feet = _observe_frame(0, 0, (500, 700), [pose(0), pose(0.015)], [])
        separate_feet = _observe_frame(0, 0, (500, 700), [pose(0), pose(0.2)], [])
        self.assertEqual(same_feet.person_count, 1)
        self.assertEqual(separate_feet.person_count, 2)

    def test_rejects_two_strikes_or_two_players(self):
        cases = [(observations(strikes=(30, 90)), "More than one possible strike"),
                 (observations(people=2), "More than one player")]
        for frames, message in cases:
            with self.subTest(message=message), self.assertRaisesRegex(UnscorableShotError, message):
                find_single_contact(frames)


class VideoTimelineTests(unittest.TestCase):
    def scan(self, presentation_times_ms, nominal_fps):
        times = iter(presentation_times_ms)
        values = {
            cv2.CAP_PROP_FPS: nominal_fps,
            cv2.CAP_PROP_FRAME_WIDTH: 1280,
            cv2.CAP_PROP_FRAME_HEIGHT: 720,
            cv2.CAP_PROP_FRAME_COUNT: 1000,
        }
        capture = Mock()

        def grab():
            time = next(times, None)
            values[cv2.CAP_PROP_POS_MSEC] = time
            return time is not None

        capture.grab.side_effect = grab
        capture.get.side_effect = values.__getitem__
        with patch("app.video_processing.cv2.VideoCapture", return_value=capture):
            timeline = extract_video_timeline("edited.mov")
        capture.release.assert_called_once_with()
        return timeline

    def test_uses_played_frames_and_variable_presentation_times(self):
        timeline = self.scan([800, 840, 880, 940, 980], nominal_fps=17)
        self.assertEqual(timeline.metadata.frameCount, 5)
        self.assertEqual(timeline.metadata.durationSeconds, 0.22)
        self.assertEqual([frame.timestampSeconds for frame in timeline.sample_frames()], [0, .04, .08, .14, .18])

    def test_uses_decoded_count_when_timestamps_are_unavailable(self):
        timeline = self.scan([0] * 30, nominal_fps=30)
        self.assertEqual(timeline.metadata.durationSeconds, 1)
        self.assertEqual(timeline.metadata.frameCount, 30)
        self.assertAlmostEqual(timeline.frame_times[-1], 29 / 30)

    def test_distinguishes_exact_duration_limit_from_an_overlong_clip(self):
        def scan(frame_count):
            return self.scan((index * 1000 / 30 for index in range(frame_count)), nominal_fps=30)

        self.assertEqual(scan(450).metadata.durationSeconds, 15)
        self.assertGreater(scan(900).metadata.durationSeconds, 15)
        self.assertLess(scan(900).metadata.frameCount, 900)


class UploadTests(unittest.TestCase):
    def setUp(self):
        metadata = VideoMetadata(durationSeconds=4, fps=30, width=1280, height=720, frameCount=120, sampledFrameCount=0)
        self.timeline = VideoTimeline(metadata, tuple(index / 30 for index in range(120)))
        mocked = patch("app.main.extract_video_timeline", return_value=self.timeline)
        mocked.start()
        self.addCleanup(mocked.stop)

    def test_success_keeps_api_shape_with_deterministic_partial_result(self):
        frames = observations(with_support_foot=False)
        with patch("app.main.observe_video", return_value=frames) as observe:
            first = asyncio.run(analyze_shooting(upload()))
            second = asyncio.run(analyze_shooting(upload()))
            self.assertFalse(Path(observe.call_args.args[0]).exists())

        self.assertEqual(first.overallScore, second.overallScore)
        self.assertEqual(first.technicalBreakdown, second.technicalBreakdown)
        self.assertEqual(first.aiCoachFeedback, second.aiCoachFeedback)
        self.assertEqual(first.shotMeasurements, second.shotMeasurements)
        self.assertEqual(first.videoMetadata.sampledFrameCount, len(first.sampledFrames))
        self.assertEqual(first.detectedShots, "Likely")
        self.assertEqual(first.drillValidityReport.status, "Valid")
        self.assertEqual(first.scoringVersion, "shooting-2d-v1")
        self.assertEqual({item.label for item in first.technicalBreakdown}, {"Body Posture", "Follow-through"})

    def test_upload_uses_recovery_after_inconclusive_first_pass(self):
        initial = observations(with_ball=False)
        recovered = observations()
        contact = find_single_contact(recovered)
        measurements = measure_shot(recovered, contact)
        with patch("app.main.observe_video", return_value=initial), patch(
            "app.main.recover_shot", return_value=(recovered, contact, measurements)
        ) as retry:
            response = asyncio.run(analyze_shooting(upload()))
        self.assertEqual(response.shotMeasurements, measurements)
        self.assertIs(retry.call_args.args[2], initial)

    def test_reports_partial_coverage_and_skips_drills_when_all_measures_are_strong(self):
        frames = observations()
        measurements = measure_shot(frames, find_single_contact(frames)).model_copy(
            update={"plantFootDistanceTorsoLengths": 0.42, "torsoTiltDegrees": 1, "followThroughTorsoLengths": None}
        )
        with patch("app.main.observe_video", return_value=frames), patch("app.main.measure_shot", return_value=measurements):
            result = asyncio.run(analyze_shooting(upload()))
        self.assertEqual(result.overallScore, 100)
        self.assertEqual((len(result.technicalBreakdown), result.techniqueMetricsTotal), (2, 3))
        self.assertEqual(result.mainFocus, "No clear weakness")
        self.assertEqual(result.recommendedTraining, [])
        self.assertTrue(any("Partial assessment" in item for item in result.videoQualityReport.warnings))
        self.assertIn("The score covers 2 of 3 technique metrics.", result.aiCoachFeedback)

    def test_upload_keeps_ambiguity_error_without_retrying(self):
        with patch("app.main.observe_video", return_value=observations(people=2)), patch("app.main.recover_shot") as retry:
            with self.assertRaisesRegex(HTTPException, "More than one player"):
                asyncio.run(analyze_shooting(upload()))
        retry.assert_not_called()

    def test_unscorable_clip_and_missing_models_use_existing_error_shape(self):
        cases = [(422, {"return_value": observations(with_ball=False)}),
                 (503, {"side_effect": ShotVisionError("test model error")})]
        for status_code, options in cases:
            with self.subTest(status_code=status_code), patch("app.main.observe_video", **options) as observe:
                with patch("app.main.logger.exception"), patch(
                    "app.shot_recovery.observe_video", return_value=observations(with_ball=False)
                ), self.assertRaises(HTTPException) as error:
                    asyncio.run(analyze_shooting(upload()))
                self.assertEqual(error.exception.status_code, status_code)
                self.assertTrue(error.exception.detail)
                self.assertFalse(Path(observe.call_args.args[0]).exists())

    def test_processes_two_second_clip_but_rejects_under_one_second(self):
        frames = observations(strikes=(30,))[:60]
        metadata = VideoMetadata(durationSeconds=2, fps=30, width=1280, height=720, frameCount=60, sampledFrameCount=0)
        timeline = VideoTimeline(metadata, self.timeline.frame_times[:60])
        with patch("app.main.extract_video_timeline", return_value=timeline), patch("app.main.observe_video", return_value=frames):
            result = asyncio.run(analyze_shooting(upload()))
            self.assertEqual(result.videoMetadata.durationSeconds, 2)
        too_short = replace(timeline, metadata=metadata.model_copy(update={"durationSeconds": 0.999}))
        with patch("app.main.extract_video_timeline", return_value=too_short):
            with self.assertRaisesRegex(HTTPException, "too short"):
                asyncio.run(analyze_shooting(upload()))


if __name__ == "__main__":
    unittest.main()
