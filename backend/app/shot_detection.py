from __future__ import annotations

from bisect import bisect_left, bisect_right
from dataclasses import dataclass, replace
from math import atan2, degrees, dist, isfinite
from statistics import median
from typing import Literal

from .models import ShotMeasurements
from .shot_vision import Ball, FrameObservation, Point


Foot = Literal["left", "right"]
Evidence = Literal["tracked", "short-flight", "occluded", "edge-disappearance"]
FEET: dict[Foot, tuple[int, int, int]] = {"left": (27, 29, 31), "right": (28, 30, 32)}
MAX_TRACK_GAP = 0.14


class UnscorableShotError(Exception):
    """The clip does not provide enough evidence for a technique score."""

    def __init__(self, message: str, *, recoverable: bool = True, contact: ShotContact | None = None):
        super().__init__(message)
        self.recoverable = recoverable
        self.contact = contact


@dataclass(frozen=True)
class ShotContact:
    time: float
    foot: Foot
    frame: FrameObservation
    ball: Ball
    direction: Point
    evidence: Evidence = "tracked"

    @property
    def limited_ball_track(self) -> bool:
        return self.evidence != "tracked"


def find_single_contact(frames: list[FrameObservation], *, recover_flight: bool = False) -> ShotContact:
    if not any(frame.balls for frame in frames):
        raise UnscorableShotError("The ball was not detected. Keep it clearly visible around the strike.")

    times = [frame.time for frame in frames]
    contacts: list[tuple[float, ShotContact]] = []
    motion_found = False
    for index, frame in enumerate(frames):
        preceding = frames[bisect_left(times, frame.time - 0.22, 0, index):index]
        following = frames[index + 1:bisect_right(times, frame.time + 0.44, index + 1)]
        for ball in frame.balls:
            if ball.blurred:
                continue
            velocity = _approach_velocity(preceding, frame.time, ball)
            if velocity is None:
                continue
            spare_balls = [other for other in frame.balls if other is not ball]
            flight = _find_flight(frame, ball, velocity, spare_balls, following)
            if flight is None and recover_flight:
                flight = _recovered_flight(frame, ball, velocity, spare_balls, following)
            if flight is None:
                flight = _edge_disappearance(frame, ball, velocity, following)
            if flight is None:
                continue

            motion_found = True
            start, end, contact_ball, direction, evidence = flight
            left = bisect_left(times, start - 0.08)
            right = bisect_right(times, end + 0.08)
            contact_frames = frames[left:right]
            contact = _closest_foot(contact_frames, start, end, contact_ball, direction, evidence)
            if contact is None and recover_flight and evidence == "occluded":
                contact = _unique_foot_crossing(contact_frames, start, end, contact_ball, direction)
            if contact is not None:
                contacts.append(contact)

    if not contacts:
        if motion_found:
            raise UnscorableShotError("The ball moved, but CoachAI could not verify which foot made contact. Keep both feet and the ball clear around the kick.")
        raise UnscorableShotError("CoachAI could not verify how the ball moved at the kick. Keep the ball visible just before and after contact.")

    contacts.sort(key=lambda candidate: candidate[1].time)
    latest = contacts[-1][1]
    if latest.time - contacts[0][1].time > 0.25 and not has_multiple_balls(frames):
        raise UnscorableShotError("More than one possible strike was detected. Upload a clip with a single shot.", recoverable=False)

    # Adjacent detections can describe the same kick. Use the strongest evidence for the last kick.
    last_event = [
        (cost, contact) for cost, contact in contacts
        if latest.time - contact.time <= 0.20
        and dist(latest.ball.center, contact.ball.center) <= max(2.5 * latest.ball.radius, 0.035)
    ]
    _, contact = min(last_event, key=lambda candidate: (candidate[1].limited_ball_track, candidate[0]))
    if sum(frame.person_count > 1 for frame in frames if abs(frame.time - contact.time) <= 0.25) >= 2:
        raise UnscorableShotError("More than one player is visible around the strike. Record one player in frame.", recoverable=False)
    return contact


def has_multiple_balls(frames: list[FrameObservation]) -> bool:
    return sum(sum(ball.confidence >= 0.30 and not ball.blurred for ball in frame.balls) > 1 for frame in frames) >= 3


def _approach_velocity(
    preceding: list[FrameObservation], time: float, ball: Ball
) -> Point | None:
    samples = [(time, ball)]
    for frame in reversed(preceding):
        last_time, last_ball = samples[-1]
        if last_time - frame.time > MAX_TRACK_GAP:
            break
        nearest = min(
            (candidate for candidate in frame.balls if not candidate.blurred and _similar_ball_size(ball, candidate)),
            key=lambda candidate: dist(candidate.center, last_ball.center),
            default=None,
        )
        if nearest is not None and dist(nearest.center, last_ball.center) <= max(1.4 * ball.radius, 0.025):
            samples.append((frame.time, nearest))

    start, first = samples[-1]
    if len(samples) < 3 or time - start < 0.07:
        return None
    velocity = _scale(_offset(ball.center, first.center), 1 / (time - start))
    if any(dist(item.center, _project(ball.center, velocity, t - time)) > max(ball.radius, 0.008)
           for t, item in samples):
        return None
    return velocity


Flight = tuple[float, float, Ball, Point, Evidence]


def _find_flight(
    anchor: FrameObservation, ball: Ball, velocity: Point, spare_balls: list[Ball], following: list[FrameObservation]
) -> Flight | None:
    for index, frame in enumerate(following):
        gap = frame.time - anchor.time
        if gap > 0.30:
            break
        expected = _project(ball.center, velocity, gap)
        relevant = [candidate for candidate in frame.balls
                    if _similar_ball_size(ball, candidate) and not _near_spare(candidate, spare_balls, velocity, gap)]
        if any(dist(candidate.center, expected) < max(1.1 * ball.radius, 0.010) for candidate in relevant):
            return None

        for first in relevant:
            direction = None
            for next_frame in following[index + 1:]:
                flight_time = next_frame.time - frame.time
                if flight_time > MAX_TRACK_GAP:
                    break
                for second in next_frame.balls:
                    if _near_spare(second, spare_balls, velocity, next_frame.time - anchor.time):
                        continue
                    if gap > MAX_TRACK_GAP:
                        inferred = _bridge_contact(anchor, ball, velocity, frame, first, next_frame, second)
                        if inferred is not None:
                            return inferred
                    else:
                        direction = _confirmed_direction(ball, first, second)
                        if direction is not None and _dot(_offset(first.center, expected), direction) >= max(1.1 * ball.radius, 0.008):
                            moved_ball = replace(ball, center=_project(ball.center, velocity, gap / 2))
                            return anchor.time, frame.time, moved_ball, direction, "tracked"

            if gap <= MAX_TRACK_GAP and direction is None:
                later = following[index + 1:index + 3]
                if later and not any(
                    _similar_ball_size(ball, candidate) and not _near_spare(candidate, spare_balls, velocity, f.time - anchor.time)
                    for f in later for candidate in f.balls
                ):
                    direction = _exiting_direction(ball, first, frame.image_size, gap, later[-1].time - frame.time)
                    if direction is not None and _dot(_offset(first.center, expected), direction) >= max(1.1 * ball.radius, 0.008):
                        return anchor.time, frame.time, ball, direction, "short-flight"

        if relevant:
            return None
    return None


def _near_spare(ball: Ball, spares: list[Ball], velocity: Point, elapsed: float) -> bool:
    return any(
        dist(ball.center, _project(spare.center, velocity, elapsed)) <= max(1.35 * spare.radius, 0.018)
        for spare in spares
    )


def _recovered_flight(
    anchor: FrameObservation, ball: Ball, velocity: Point, spares: list[Ball], following: list[FrameObservation]
) -> Flight | None:
    # Require three actual detections moving consistently away from the original ball.
    # Include lower-confidence detections only within the local retry region.
    candidates = [
        (frame.time, candidate)
        for frame in following
        for candidate in frame.balls
        if 0.32 <= candidate.radius / ball.radius <= 2
        and not _near_spare(candidate, spares, velocity, frame.time - anchor.time)
    ]
    for index, (first_time, first) in enumerate(candidates):
        gap = first_time - anchor.time
        if gap > 0.27:
            break
        origin = _project(ball.center, velocity, gap)
        departure = _offset(first.center, origin)
        distance = dist(first.center, origin)
        if distance < max(1.5 * ball.radius, 0.016):
            continue
        direction = _scale(departure, 1 / distance)
        for second_index, (second_time, second) in enumerate(candidates[index + 1:], index + 1):
            elapsed = second_time - first_time
            if elapsed > MAX_TRACK_GAP:
                break
            step = _offset(second.center, first.center)
            advance = _dot(step, direction)
            if elapsed <= 0 or not _follows_direction(step, direction) or advance < max(ball.radius, 0.008):
                continue
            speed = advance / elapsed
            if speed < 0.30:
                continue
            contact_time = first_time - distance / speed
            if not anchor.time <= contact_time <= first_time - 0.02:
                continue
            for third_time, third in candidates[second_index + 1:]:
                if third_time - second_time > MAX_TRACK_GAP:
                    break
                movement = _offset(third.center, second.center)
                if third_time > second_time and _dot(movement, direction) >= 0.006 and _follows_direction(movement, direction):
                    if any(
                        contact_time + 0.04 < time <= third_time
                        and _similar_ball_size(ball, candidate)
                        and dist(candidate.center, _project(ball.center, velocity, time - anchor.time)) <= max(0.75 * ball.radius, 0.009)
                        for time, candidate in candidates
                    ):
                        continue
                    center = _project(ball.center, velocity, contact_time - anchor.time)
                    return max(anchor.time, contact_time - 0.025), contact_time + 0.025, replace(ball, center=center), direction, "occluded"
    return None


def _follows_direction(step: Point, direction: Point) -> bool:
    return _dot(step, direction) >= 0.70 * dist(step, (0, 0))


def _bridge_contact(
    anchor: FrameObservation, ball: Ball, velocity: Point,
    first_frame: FrameObservation, first: Ball, second_frame: FrameObservation, second: Ball,
) -> Flight | None:
    if not _similar_ball_size(ball, second):
        return None
    elapsed = first_frame.time - anchor.time
    displacement = dist(first.center, second.center)
    if displacement < max(ball.radius, 0.012):
        return None
    travel = _offset(second.center, first.center)
    flight_velocity = _scale(travel, 1 / (second_frame.time - first_frame.time))
    relative_velocity = _offset(flight_velocity, velocity)
    speed_squared = _dot(relative_velocity, relative_velocity)
    if speed_squared < 0.25:
        return None
    discrepancy = _offset(first.center, _project(ball.center, velocity, elapsed))
    backtrack = _dot(discrepancy, relative_velocity) / speed_squared
    if not 0.03 <= backtrack <= elapsed - 0.03:
        return None
    when = first_frame.time - backtrack
    contact_center = _project(ball.center, velocity, when - anchor.time)
    if dist(contact_center, _project(first.center, flight_velocity, -backtrack)) > max(ball.radius, 0.018):
        return None
    direction = _scale(travel, 1 / displacement)
    return when - 0.018, when + 0.018, replace(ball, center=contact_center), direction, "occluded"


def _edge_disappearance(
    anchor: FrameObservation, ball: Ball, velocity: Point, following: list[FrameObservation]
) -> Flight | None:
    if not following or following[-1].time - anchor.time < 0.10:
        return None
    for frame in following:
        expected = _project(ball.center, velocity, frame.time - anchor.time)
        if any(dist(candidate.center, expected) <= max(1.5 * ball.radius, 0.025) for candidate in frame.balls):
            return None

    x, y = ball.center
    width, height = anchor.image_size
    margin = max(2 * ball.radius, 0.035)
    edge_distance, direction = min(
        [(x, (-1.0, 0.0)), (width - x, (1.0, 0.0)), (y, (0.0, -1.0)), (height - y, (0.0, 1.0))],
        key=lambda edge: edge[0],
    )
    if edge_distance > margin or _dot(velocity, direction) > 0.35:
        return None
    return anchor.time, anchor.time + 0.05, ball, direction, "edge-disappearance"


def _similar_ball_size(reference: Ball, other: Ball) -> bool:
    return 0.5 <= other.radius / reference.radius <= 2


def _confirmed_direction(ball: Ball, first: Ball, second: Ball) -> Point | None:
    displacement = dist(second.center, ball.center)
    if not _similar_ball_size(ball, second) or displacement < max(2.5 * ball.radius, 0.020):
        return None
    direction = _scale(_offset(second.center, ball.center), 1 / displacement)
    first_projection = _dot(_offset(first.center, ball.center), direction)
    if not 0 < first_projection <= displacement * 0.88:
        return None
    if dist(first.center, _project(ball.center, direction, first_projection)) > max(ball.radius, 0.009):
        return None
    return direction


def _exiting_direction(
    ball: Ball, first: Ball, image_size: Point, flight_time: float, next_frame_delay: float
) -> Point | None:
    displacement = dist(first.center, ball.center)
    if displacement < max(2.3 * ball.radius, 0.06) or not 0 < next_frame_delay <= MAX_TRACK_GAP:
        return None
    travel = _offset(first.center, ball.center)
    predicted = _project(first.center, travel, next_frame_delay / flight_time)
    edge_margin = max(4 * first.radius, 0.045)
    leaves_frame = any(
        (change < 0 and position <= edge_margin and following <= first.radius)
        or (change > 0 and position >= edge - edge_margin and following >= edge - first.radius)
        for change, position, following, edge in zip(travel, first.center, predicted, image_size)
    )
    return _scale(travel, 1 / displacement) if leaves_frame else None


def measure_shot(frames: list[FrameObservation], contact: ShotContact) -> ShotMeasurements:
    hip, shoulder = _joint_center(contact.frame, 23, 24), _joint_center(contact.frame, 11, 12)
    if hip is None or shoulder is None or dist(hip, shoulder) < 0.025:
        raise UnscorableShotError(
            "The player is too far away or the torso is obscured. Re-record with the full body visible.", contact=contact,
        )

    torso_length = dist(hip, shoulder)
    torso = _offset(shoulder, hip)
    tilt = degrees(atan2(abs(torso[0]), -torso[1]))

    support_foot: Foot = "left" if contact.foot == "right" else "right"
    support_point = _joint_center(contact.frame, FEET[support_foot][1], FEET[support_foot][2])
    ball_ground = (contact.ball.center[0], contact.ball.center[1] + contact.ball.radius)
    plant_distance = dist(support_point, ball_ground) / torso_length if support_point is not None else None

    follow_through = None
    if not contact.limited_ball_track:
        follow_through = _measure_follow_through(frames, contact, hip, torso_length)
    if plant_distance is None and follow_through is None:
        raise UnscorableShotError("CoachAI needs a clearer view of both feet and the ball around the kick.", contact=contact)

    return ShotMeasurements(
        contactTimeSeconds=round(contact.time, 3),
        kickingFoot=contact.foot,
        plantFootDistanceTorsoLengths=round(plant_distance, 3) if plant_distance is not None else None,
        torsoTiltDegrees=round(tilt, 1),
        followThroughTorsoLengths=round(follow_through, 3) if follow_through is not None else None,
    )


def _closest_foot(
    frames: list[FrameObservation],
    last_ball_time: float,
    first_moving_time: float,
    ball: Ball,
    direction: Point,
    evidence: Evidence,
) -> tuple[float, ShotContact] | None:
    middle = (last_ball_time + first_moving_time) / 2
    nearest: dict[Foot, tuple[float, ShotContact]] = {}
    for frame in frames:
        if not last_ball_time - 0.045 <= frame.time <= first_moving_time + 0.045:
            continue
        hip = _joint_center(frame, 23, 24)
        shoulder = _joint_center(frame, 11, 12)
        if hip is None or shoulder is None:
            continue
        torso_length = dist(hip, shoulder)
        if torso_length < 0.025:
            continue
        reach = ball.radius + 0.20 * torso_length
        for foot, (ankle, _, toe) in FEET.items():
            distance = min((dist(point, ball.center) for index in (ankle, toe)
                            if (point := frame.joint(index)) is not None), default=float("inf"))
            if distance > reach:
                continue
            cost = distance / reach + 2 * abs(frame.time - middle)
            if foot not in nearest or cost < nearest[foot][0]:
                time = max(last_ball_time, min(first_moving_time, frame.time))
                nearest[foot] = (cost, ShotContact(time, foot, frame, ball, direction, evidence))

    ranked = []
    for foot in FEET:
        if foot not in nearest:
            crossing = _interpolated_foot(frames, foot, last_ball_time, first_moving_time, ball, direction, evidence)
            if crossing is not None:
                nearest[foot] = crossing
    for foot, (cost, contact) in nearest.items():
        drive = _foot_drive(frames, foot, middle, direction)
        if evidence != "tracked" and drive < max(0.6 * ball.radius, 0.015):
            continue
        if evidence == "edge-disappearance" and not _foot_passes_ball(frames, foot, middle, ball, direction):
            continue
        ranked.append((cost - min(0.6, max(0, drive) / (3 * ball.radius)), contact))
    ranked.sort(key=lambda candidate: candidate[0])
    if not ranked or (len(ranked) == 2 and ranked[1][0] - ranked[0][0] < 0.20):
        return None
    return ranked[0]


def _foot_passes_ball(frames: list[FrameObservation], foot: Foot, middle: float, ball: Ball, direction: Point) -> bool:
    ankle, _, toe = FEET[foot]
    return any(
        _dot(_offset(point, ball.center), direction) >= 0.15 * ball.radius
        for frame in frames if middle - 0.04 <= frame.time <= middle + 0.06
        for index in (ankle, toe)
        if (point := frame.joint(index)) is not None and dist(point, ball.center) <= 1.6 * ball.radius
    )


def _unique_foot_crossing(
    frames: list[FrameObservation], start: float, end: float, ball: Ball, direction: Point
) -> tuple[float, ShotContact] | None:
    crossings = [crossing for foot in FEET
                 if (crossing := _interpolated_foot(frames, foot, start, end, ball, direction, "occluded")) is not None]
    if len(crossings) != 1:
        return None
    cost, contact = crossings[0]
    support = "left" if contact.foot == "right" else "right"
    _, heel, toe = FEET[support]
    if _joint_center(contact.frame, heel, toe) is None:
        # The estimated contact is between frames. Use the nearest complete pose for measurements.
        nearby = [frame for frame in frames if abs(frame.time - contact.time) <= 0.04
                  and _joint_center(frame, heel, toe) is not None
                  and _joint_center(frame, 23, 24) is not None
                  and _joint_center(frame, 11, 12) is not None]
        if nearby:
            contact = replace(contact, frame=min(nearby, key=lambda frame: abs(frame.time - contact.time)))
    return cost, contact


def _interpolated_foot(
    frames: list[FrameObservation], foot: Foot, start: float, end: float,
    ball: Ball, direction: Point, evidence: Evidence,
) -> tuple[float, ShotContact] | None:
    best = None
    ankle, _, toe = FEET[foot]
    for before, after in zip(frames, frames[1:]):
        gap = after.time - before.time
        if gap > 0.065 or before.time > end + 0.04 or after.time < start - 0.04:
            continue
        for joint in (ankle, toe):
            origin, finish = before.joint(joint), after.joint(joint)
            if origin is None or finish is None:
                continue
            travel = _offset(finish, origin)
            if _dot(travel, direction) < max(0.65 * ball.radius, 0.012):
                continue
            fraction = _dot(_offset(ball.center, origin), travel) / _dot(travel, travel)
            if not 0 < fraction < 1:
                continue
            distance = dist(ball.center, _project(origin, travel, fraction))
            if distance > 1.35 * ball.radius:
                continue
            time = before.time + fraction * gap
            frame = before if fraction < 0.5 else after
            if _joint_center(frame, 23, 24) is None or _joint_center(frame, 11, 12) is None:
                continue
            cost = distance / (1.35 * ball.radius) + 0.15 + 2 * abs(time - (start + end) / 2)
            if best is None or cost < best[0]:
                best = (cost, ShotContact(max(start, min(end, time)), foot, frame, ball, direction, evidence))
    return best


def _foot_drive(frames: list[FrameObservation], foot: Foot, middle: float, direction: Point) -> float:
    ankle, _, toe = FEET[foot]
    drive = 0.0
    for joint in (ankle, toe):
        samples = [(frame.time, _dot(point, direction)) for frame in frames if (point := frame.joint(joint)) is not None]
        before = [position for time, position in samples if time < middle]
        after = [position for time, position in samples if time >= middle]
        if before and after:
            drive = max(drive, max(after) - min(before))
    return drive


def _measure_follow_through(
    frames: list[FrameObservation], contact: ShotContact, hip: Point, torso_length: float
) -> float | None:
    ankle = FEET[contact.foot][0]
    initial_ankle = contact.frame.joint(ankle)
    if initial_ankle is None:
        return None

    initial = _offset(initial_ankle, hip)
    movement = []
    for frame in frames:
        if not contact.time + 0.06 <= frame.time <= contact.time + 0.30:
            continue
        foot, frame_hip = frame.joint(ankle), _joint_center(frame, 23, 24)
        if foot is not None and frame_hip is not None:
            relative_motion = _offset(_offset(foot, frame_hip), initial)
            movement.append((frame.time, _dot(relative_motion, contact.direction) / torso_length))

    if len(movement) < 3 or movement[-1][0] - movement[0][0] < 0.06:
        return None
    value = median(sorted(distance for _, distance in movement)[-3:])
    return value if isfinite(value) else None


def _joint_center(frame: FrameObservation, left: int, right: int) -> Point | None:
    first, second = frame.joint(left), frame.joint(right)
    if first is None or second is None:
        return first if second is None else second
    return ((first[0] + second[0]) / 2, (first[1] + second[1]) / 2)


def _offset(point: Point, origin: Point) -> Point:
    return (point[0] - origin[0], point[1] - origin[1])


def _scale(point: Point, factor: float) -> Point:
    return (point[0] * factor, point[1] * factor)


def _project(origin: Point, vector: Point, factor: float) -> Point:
    return (origin[0] + vector[0] * factor, origin[1] + vector[1] * factor)


def _dot(first: Point, second: Point) -> float:
    return first[0] * second[0] + first[1] * second[1]
