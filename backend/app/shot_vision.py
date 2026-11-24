from __future__ import annotations

from contextlib import ExitStack
from dataclasses import dataclass, replace
from math import dist, isfinite

import cv2

from .config import BALL_MODEL_PATH, POSE_MODEL_PATH
from .models import PoseAnalysisSummary, PoseFrameSummary
from .pose_analysis import build_pose_summary
from .video_processing import VideoTimeline


MAX_ANALYSIS_FPS = 30
MAX_INFERENCE_EDGE = 960
MIN_JOINT_VISIBILITY = 0.55

Point = tuple[float, float]
PoseJoints = tuple[Point | None, ...]


class ShotVisionError(Exception):
    """Local models could not process the clip."""


@dataclass(frozen=True)
class Ball:
    center: Point
    radius: float
    confidence: float = 1.0
    blurred: bool = False
    motion_only: bool = False


@dataclass(frozen=True)
class FrameObservation:
    index: int
    time: float
    joints: PoseJoints
    balls: tuple[Ball, ...] = ()
    person_count: int = 1
    visibility_average: float | None = None
    image_size: Point = (1.0, 1.0)
    alternate_poses: tuple[PoseJoints, ...] = ()

    def joint(self, index: int) -> Point | None:
        return self.joints[index] if index < len(self.joints) else None


@dataclass(frozen=True)
class InferenceRegion:
    center: Point
    start: float
    end: float
    width_fraction: float = 0.48
    ball_threshold: float = 0.25
    track_motion: bool = False

    def bounds(self, width: int, height: int) -> tuple[int, int, int, int]:
        edge = max(width, height)
        crop_width = min(width, max(1, round(self.width_fraction * edge)))
        crop_height = min(height, max(1, round(0.90 * crop_width)))
        left = max(0, min(width - crop_width, round(self.center[0] * edge - crop_width / 2)))
        top = max(0, min(height - crop_height, round(self.center[1] * edge - crop_height * 0.55)))
        return left, top, left + crop_width, top + crop_height


def observe_video(
    video_path: str, timeline: VideoTimeline, region: InferenceRegion | None = None
) -> list[FrameObservation]:
    missing_models = [path.name for path in (POSE_MODEL_PATH, BALL_MODEL_PATH) if not path.is_file()]
    if missing_models:
        raise ShotVisionError(f"Missing local models: {', '.join(missing_models)}")

    capture = cv2.VideoCapture(video_path)
    try:
        if not capture.isOpened():
            raise ShotVisionError("OpenCV could not reopen the video.")

        import mediapipe as mp

        vision = mp.tasks.vision
        pose_options = vision.PoseLandmarkerOptions(
            base_options=mp.tasks.BaseOptions(model_asset_path=str(POSE_MODEL_PATH)),
            running_mode=vision.RunningMode.VIDEO,
            num_poses=2,
        )
        ball_options = vision.ObjectDetectorOptions(
            base_options=mp.tasks.BaseOptions(model_asset_path=str(BALL_MODEL_PATH)),
            running_mode=vision.RunningMode.VIDEO,
            score_threshold=region.ball_threshold if region is not None else 0.25,
            max_results=8 if region is not None else -1,
            category_allowlist=["sports ball"],
        )

        with ExitStack() as models:
            landmarker = models.enter_context(vision.PoseLandmarker.create_from_options(pose_options))
            detector = models.enter_context(vision.ObjectDetector.create_from_options(ball_options))
            observations = []
            reduce_frame_rate = timeline.metadata.fps > MAX_ANALYSIS_FPS
            next_sample_time = 0.0
            last_timestamp = -1
            previous_gray = None

            for frame_index, time in enumerate(timeline.frame_times):
                if region is not None and time > region.end:
                    break
                if not capture.grab():
                    break
                if region is not None and time < region.start:
                    continue
                timestamp = round(time * 1000)
                if time + 1e-9 < next_sample_time or timestamp <= last_timestamp:
                    continue
                readable, frame = capture.retrieve()
                if not readable:
                    break
                if reduce_frame_rate:
                    next_sample_time = (int((time + 1e-9) * MAX_ANALYSIS_FPS) + 1) / MAX_ANALYSIS_FPS
                last_timestamp = timestamp
                if region is not None:
                    full_height, full_width = frame.shape[:2]
                    left, top, right, bottom = region.bounds(full_width, full_height)
                    frame = frame[top:bottom, left:right]
                edge = max(frame.shape[:2])
                if edge > MAX_INFERENCE_EDGE:
                    scale = MAX_INFERENCE_EDGE / edge
                    frame = cv2.resize(frame, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                poses = landmarker.detect_for_video(image, timestamp).pose_landmarks
                balls = detector.detect_for_video(image, timestamp).detections
                observed = _observe_frame(frame_index, time, rgb.shape[:2], poses, balls)
                if region is not None and region.track_motion:
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    if previous_gray is not None:
                        observed = replace(observed, balls=(*observed.balls, *_motion_candidates(previous_gray, gray)))
                    previous_gray = gray
                if region is not None:
                    observed = _restore_frame_coordinates(observed, left, top, max(right - left, bottom - top),
                                                          full_width, full_height)
                observations.append(observed)

        return observations
    except ShotVisionError:
        raise
    except (ImportError, AttributeError, OSError, RuntimeError, ValueError, cv2.error) as exc:
        raise ShotVisionError("OpenCV or MediaPipe could not complete inference.") from exc
    finally:
        capture.release()


def _motion_candidates(previous, current) -> tuple[Ball, ...]:
    height, width = current.shape
    edge = max(height, width)
    # Retain compact moving highlights. They can support an outgoing track but cannot seed it.
    change = cv2.subtract(current, previous)
    local_background = cv2.GaussianBlur(current, (0, 0), max(2, edge * 0.016))
    contrast = cv2.subtract(current, local_background)
    moving = cv2.bitwise_and(cv2.inRange(change, 18, 255), cv2.inRange(contrast, 20, 255))
    _, _, boxes, centers = cv2.connectedComponentsWithStats(moving)
    candidates = []
    for (_, _, box_width, box_height, area), center in zip(boxes[1:], centers[1:]):
        short, long = sorted((box_width, box_height))
        if area < 4 or short < 2 or long > edge * 0.12 or long > 5 * short:
            continue
        radius = (short + long) / (4 * edge)
        candidates.append(Ball(tuple(float(value) / edge for value in center), radius, 0.0, motion_only=True))
    return tuple(candidates)


def _restore_frame_coordinates(
    frame: FrameObservation, left: int, top: int, crop_edge: int, width: int, height: int
) -> FrameObservation:
    edge = max(width, height)

    def restore(point: Point) -> Point:
        return (left + crop_edge * point[0]) / edge, (top + crop_edge * point[1]) / edge

    def restore_pose(pose: PoseJoints) -> PoseJoints:
        return tuple(restore(point) if point is not None else None for point in pose)

    return replace(
        frame,
        joints=restore_pose(frame.joints),
        alternate_poses=tuple(restore_pose(pose) for pose in frame.alternate_poses),
        balls=tuple(replace(ball, center=restore(ball.center), radius=ball.radius * crop_edge / edge)
                    for ball in frame.balls),
        image_size=(width / edge, height / edge),
    )


def summarize_pose(observations: list[FrameObservation]) -> PoseAnalysisSummary:
    # Keep the existing response compact even when inference processes hundreds of frames.
    count = min(20, len(observations))
    sample_indexes = {round(index * (len(observations) - 1) / max(1, count - 1)) for index in range(count)}
    sampled_frames = [observations[index] for index in sorted(sample_indexes)]
    return build_pose_summary([
        PoseFrameSummary(
            frameIndex=frame.index,
            timestampSeconds=round(frame.time, 3),
            poseDetected=bool(frame.joints),
            landmarkCount=len(frame.joints),
            visibilityAverage=frame.visibility_average,
        )
        for frame in sampled_frames
    ])


def _observe_frame(index: int, time: float, shape: tuple[int, int], poses, balls) -> FrameObservation:
    height, width = shape
    edge = max(height, width)
    # The detector can return two skeletons over the same player's feet.
    distinct_poses = []
    for pose in poses:
        if not any(_same_footprint(existing, pose, width / edge, height / edge) for existing in distinct_poses):
            distinct_poses.append(pose)
    landmarks = distinct_poses[0] if len(distinct_poses) == 1 else []
    def visible_joints(pose) -> PoseJoints:
        return tuple(
            (point.x * width / edge, point.y * height / edge)
            if point.visibility is not None and point.visibility >= MIN_JOINT_VISIBILITY
            and 0 <= point.x <= 1 and 0 <= point.y <= 1 else None
            for point in pose
        )

    joints = visible_joints(landmarks)
    alternate_poses = tuple(visible_joints(pose) for pose in distinct_poses) if len(distinct_poses) > 1 else ()
    visibility = [point.visibility for point in landmarks if point.visibility is not None and isfinite(point.visibility)]
    candidates = []
    for detection in balls:
        box = detection.bounding_box
        short, long = sorted((box.width, box.height))
        if short <= 0 or long > 4 * short:
            continue
        blurred = long > 2.5 * short
        candidate = Ball(
            center=((box.origin_x + box.width / 2) / edge, (box.origin_y + box.height / 2) / edge),
            radius=(short / 2 if blurred else (short + long) / 4) / edge,
            confidence=detection.categories[0].score,
            blurred=blurred,
        )
        if all(dist(candidate.center, other.center) > max(candidate.radius, other.radius) for other in candidates):
            candidates.append(candidate)

    return FrameObservation(
        index=index,
        time=time,
        joints=joints,
        balls=tuple(candidates),
        person_count=len(distinct_poses),
        visibility_average=round(sum(visibility) / len(visibility), 3) if visibility else None,
        image_size=(width / edge, height / edge),
        alternate_poses=alternate_poses,
    )


def _same_footprint(first, second, width: float, height: float) -> bool:
    def point(pose, index):
        joint = pose[index]
        return joint.x * width, joint.y * height

    if not all(pose[index].visibility >= MIN_JOINT_VISIBILITY for pose in (first, second) for index in (31, 32)):
        return False
    first_feet = [point(first, index) for index in (31, 32)]
    second_feet = [point(second, index) for index in (31, 32)]
    first_center = tuple(sum(axis) / 2 for axis in zip(*first_feet))
    second_center = tuple(sum(axis) / 2 for axis in zip(*second_feet))
    return dist(first_center, second_center) <= 0.055 and min(
        dist(a, b) for a in first_feet for b in second_feet
    ) <= 0.028
