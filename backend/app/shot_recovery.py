from bisect import bisect_left, bisect_right
from dataclasses import replace
import logging
from math import dist

from .models import ShotMeasurements
from .shot_detection import (
    FEET,
    ShotContact,
    UnscorableShotError,
    _approach_velocity,
    _joint_center,
    _offset,
    _project,
    find_single_contact,
    has_multiple_balls,
    measure_shot,
)
from .shot_vision import FrameObservation, InferenceRegion, ShotVisionError, observe_video
from .shot_tracking import flight_tracks, track_local_contact
from .video_processing import VideoTimeline


logger = logging.getLogger("uvicorn.error").getChild(__name__)
FOOT_INDEXES = tuple(index for ankle, _, toe in FEET.values() for index in (ankle, toe))
RecoveryResult = tuple[list[FrameObservation], ShotContact, ShotMeasurements]


def recover_shot(
    path: str, timeline: VideoTimeline, original: list[FrameObservation]
) -> RecoveryResult | None:
    foot_regions = _foot_regions(original)
    for seed, regions in (("ball", _candidate_regions(original)), ("foot", foot_regions)):
        logger.info("Shot recovery seed=%s regions=%d", seed, len(regions))
        result = _recover_regions(path, timeline, original, regions, seed)
        if result is not None:
            return result
    return _recover_regions(path, timeline, original, [*_flight_regions(original), *foot_regions], "track")


def _recover_regions(
    path: str, timeline: VideoTimeline, original: list[FrameObservation],
    regions: list[tuple[InferenceRegion, float]], seed: str,
) -> RecoveryResult | None:
    recovered = []
    for region, anchor_time in regions:
        detail = replace(region, width_fraction=0.30, ball_threshold=0.09)
        scans = (region, detail) if seed != "track" else (replace(detail, track_motion=True),)
        for scan in scans:
            try:
                frames = observe_video(path, timeline, scan)
                if scan.track_motion:
                    contact = track_local_contact(frames, anchor_time)
                    if contact is None:
                        continue
                else:
                    contact = find_single_contact(frames, recover_flight=scan is detail)
                if dist(contact.ball.center, region.center) > 0.30 * scan.width_fraction or abs(contact.time - anchor_time) > 0.38:
                    continue
                nearby = [frame for frame in original if abs(frame.time - contact.time) <= 0.25 and frame.person_count > 1]
                ambiguous = len(nearby) >= 2 if seed == "ball" else _competing_feet(nearby, contact)
                if ambiguous:
                    logger.info("Shot recovery seed=%s stage=competing_players time=%.3f", seed, contact.time)
                    continue
                if scan is detail:
                    contact = replace(contact, evidence="occluded")
                measurements = measure_shot(frames, contact)
            except (UnscorableShotError, ShotVisionError) as error:
                logger.info("Shot recovery seed=%s time=%.3f center=%s width=%.2f rejected=%s",
                            seed, anchor_time, region.center, scan.width_fraction, error)
                continue
            logger.info("Shot recovery seed=%s contact=%.3f evidence=%s", seed, contact.time, contact.evidence)
            recovered.append((frames, contact, measurements))
            break

    if not recovered:
        return None
    latest = max(recovered, key=lambda result: result[1].time)[1]
    earliest = min(result[1].time for result in recovered)
    if latest.time - earliest > 0.25 and not has_multiple_balls(original):
        raise UnscorableShotError("More than one possible strike was detected. Upload a clip with a single shot.")
    latest_event = [result for result in recovered if latest.time - result[1].time <= 0.15
                    and dist(latest.ball.center, result[1].ball.center) <= max(0.035, 2.5 * latest.ball.radius)]
    return min(latest_event, key=lambda result: result[1].limited_ball_track)


def _flight_regions(frames: list[FrameObservation]) -> list[tuple[InferenceRegion, float]]:
    proposals = []
    for track in flight_tracks(frames):
        # The first detection may be several frames after the ball leaves the foot.
        center = _project(track.ball.center, track.velocity, -0.18)
        time = track.start - 0.18
        width, height = frames[0].image_size
        if time >= 0 and 0 <= center[0] <= width and 0 <= center[1] <= height:
            proposals.append((track.cost, time, center))
    selected = []
    for _, time, center in sorted(proposals):
        if any(abs(time - other_time) <= 0.5 and dist(center, region.center) <= 0.10
               for region, other_time in selected):
            continue
        selected.append((InferenceRegion(center, max(0, time - 0.45), time + 0.50), time))
        if len(selected) == 2:
            break
    return selected


def _competing_feet(frames: list[FrameObservation], contact: ShotContact) -> bool:
    reach = max(0.04, 3 * contact.ball.radius)
    return sum(
        sum(any(point is not None and dist(point, contact.ball.center) <= reach
                for point in (pose[index] for index in FOOT_INDEXES if index < len(pose)))
            for pose in frame.alternate_poses) >= 2
        for frame in frames
    ) >= 2


def _candidate_regions(frames: list[FrameObservation]) -> list[tuple[InferenceRegion, float]]:
    if not frames:
        return []
    times = [frame.time for frame in frames]
    proposals = []
    for index, frame in enumerate(frames):
        past = frames[bisect_left(times, frame.time - 0.22, 0, index):index]
        immediate = frames[index + 1:bisect_right(times, frame.time + 0.12, index + 1)]
        around = frames[bisect_left(times, frame.time - 0.15):bisect_right(times, frame.time + 0.34)]
        feet = [point for sample in around for joint in FOOT_INDEXES if (point := sample.joint(joint)) is not None]
        if times[-1] - frame.time < 0.13:
            break
        for ball in frame.balls:
            if ball.blurred or any(
                dist(ball.center, other.center) <= max(ball.radius, 0.010)
                and 0.5 <= other.radius / ball.radius <= 2
                for sample in immediate for other in sample.balls
            ):
                continue
            velocity = _approach_velocity(past, frame.time, ball)
            if velocity is None or dist(velocity, (0, 0)) > 0.35:
                continue
            proximity = min((dist(ball.center, foot) for foot in feet), default=0.10)
            proposals.append((min(proximity, 0.12) - 0.025 * ball.confidence, frame.time, ball.center))

    proposals.sort()
    selected = []
    for _, time, center in proposals:
        if any(abs(time - other_time) <= 0.55 and dist(center, region.center) <= 0.065
               for region, other_time in selected):
            continue
        selected.append((InferenceRegion(center, max(0, time - 0.55), time + 0.65), time))
        if len(selected) == 2:
            break
    return selected


def _foot_regions(frames: list[FrameObservation]) -> list[tuple[InferenceRegion, float]]:
    times = [frame.time for frame in frames]
    poses = [_pose_samples(frame) for frame in frames]
    proposals = []
    for index, time in enumerate(times):
        previous = bisect_right(times, time - 0.10, 0, index) - 1
        if previous < 0 or time - times[previous] > 0.17 or times[-1] - time < 0.13:
            continue
        follow_window = frames[bisect_left(times, time + 0.05, index):bisect_right(times, time + 0.42, index)]
        for hip, torso, feet in poses[index]:
            matches = [pose for pose in poses[previous]
                       if dist(hip, pose[0]) <= max(0.035, torso) and 0.65 <= pose[1] / torso <= 1.55]
            if not matches:
                continue
            old_hip, _, old_feet = min(matches, key=lambda pose: dist(hip, pose[0]))
            drives = [dist(_offset(foot, hip), _offset(old, old_hip)) / torso
                      if foot is not None and old is not None else 0.0 for foot, old in zip(feet, old_feet)]
            leg = int(drives[1] > drives[0])
            drive, other = drives[leg], drives[1 - leg]
            if drive < 0.37 or drive - other < 0.12:
                continue
            # A moving hip helps outrank noisy landmarks on a stationary bystander.
            approach = min(1.0, dist(hip, old_hip) / torso)
            center = feet[leg]
            if center is not None:
                ball_hint = _outbound_ball_nearby(follow_window, center)
                ahead = _project(center, _offset(hip, old_hip), 1.8)
                proposals.append((other * 0.55 - drive - 1.5 * approach - 2 * ball_hint, time, ahead))

    selected = []
    for _, time, center in sorted(proposals):
        if any(abs(time - other_time) <= 0.55 and dist(center, region.center) <= 0.12
               for region, other_time in selected):
            continue
        selected.append((InferenceRegion(center, max(0, time - 0.55), time + 0.55), time))
        if len(selected) == 2:
            break
    return selected


def _outbound_ball_nearby(frames: list[FrameObservation], foot: tuple[float, float]) -> bool:
    for index, frame in enumerate(frames):
        for first in frame.balls:
            distance = dist(first.center, foot)
            if distance > 0.18:
                continue
            for later in frames[index + 1:]:
                gap = later.time - frame.time
                if gap > 0.13:
                    break
                if any(
                    0.5 <= ball.radius / first.radius <= 2
                    and 0.20 * gap <= dist(ball.center, first.center) <= 1.7 * gap
                    and dist(ball.center, foot) - distance >= 0.008
                    for ball in later.balls
                ):
                    return True
    return False


def _pose_samples(frame: FrameObservation):
    samples = []
    for joints in frame.alternate_poses or (frame.joints,):
        pose = replace(frame, joints=joints)
        hip = _joint_center(pose, 23, 24)
        shoulder = _joint_center(pose, 11, 12)
        if hip is None or shoulder is None or (torso := dist(hip, shoulder)) < 0.022:
            continue
        feet = tuple(_joint_center(pose, ankle, toe) for ankle, _, toe in FEET.values())
        samples.append((hip, torso, feet))
    return samples
