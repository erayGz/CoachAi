from collections.abc import Iterator
from dataclasses import dataclass, replace
from math import dist

from .shot_detection import (
    ShotContact, _closest_foot, _dot, _offset, _project, _scale, _unique_foot_crossing,
)
from .shot_vision import Ball, FrameObservation, Point


@dataclass(frozen=True)
class FlightTrack:
    start: float
    ball: Ball
    velocity: Point
    cost: float


def flight_tracks(frames: list[FrameObservation], radius: float | None = None) -> Iterator[FlightTrack]:
    """Link three distinct observations using timestamps and approximately constant image velocity."""
    if radius is None:
        candidates = [tuple(ball for ball in frame.balls if not ball.motion_only) for frame in frames]
    else:
        candidates = [tuple(ball for ball in frame.balls if 0.30 <= ball.radius / radius <= 2.2) for frame in frames]
    for i, frame in enumerate(frames):
        for j in range(i + 1, len(frames)):
            gap = frames[j].time - frame.time
            if gap > 0.095:
                break
            if gap < 0.018:
                continue
            for first in candidates[i]:
                for second in candidates[j]:
                    if not 0.42 <= second.radius / first.radius <= 2.4:
                        continue
                    velocity = _scale(_offset(second.center, first.center), 1 / gap)
                    speed = dist(velocity, (0, 0))
                    if not 0.24 <= speed <= 2.2:
                        continue
                    for k in range(j + 1, len(frames)):
                        elapsed = frames[k].time - frames[j].time
                        if elapsed > 0.11:
                            break
                        if gap + elapsed < 0.065:
                            continue
                        predicted = _project(second.center, velocity, elapsed)
                        for third in candidates[k]:
                            residual = dist(third.center, predicted)
                            tolerance = max(0.005, 0.95 * first.radius, 0.12 * speed * elapsed)
                            if residual > tolerance or not 0.42 <= third.radius / first.radius <= 2.4:
                                continue
                            confidence = (first.confidence + second.confidence + third.confidence) / 3
                            travel = _offset(third.center, first.center)
                            if _dot(travel, velocity) <= 0 or dist(travel, (0, 0)) < max(0.018, 2 * first.radius):
                                continue
                            yield FlightTrack(frame.time, first, _scale(travel, 1 / (gap + elapsed)),
                                              residual / tolerance - confidence)


def track_local_contact(frames: list[FrameObservation], anchor_time: float) -> ShotContact | None:
    """Join a detected ball at rest to a local flight and an independently observed kick."""
    matches = []
    for i, frame in enumerate(frames):
        if abs(frame.time - anchor_time) > 0.48:
            continue
        for ball in frame.balls:
            if ball.motion_only or ball.blurred or ball.confidence < 0.18:
                continue
            rest_radius = max(0.007, 0.9 * ball.radius)
            if not any(0.025 <= frame.time - prior.time <= 0.20
                       and any(not candidate.motion_only and not candidate.blurred
                               and 0.5 <= candidate.radius / ball.radius <= 2
                               and dist(candidate.center, ball.center) <= rest_radius for candidate in prior.balls)
                       for prior in frames[:i]):
                continue
            nearby = [after for after in frames[i + 1:] if after.time - frame.time <= 0.49]
            # Restrict the search to where this ball could travel before the next three observations.
            nearby = [replace(after, balls=tuple(
                candidate for candidate in after.balls
                if rest_radius < dist(candidate.center, ball.center) <= min(0.24, 2.2 * (after.time - frame.time))
            )) for after in nearby]
            for track in flight_tracks(nearby, ball.radius):
                velocity = track.velocity
                backtrack = _dot(_offset(track.ball.center, ball.center), velocity) / _dot(velocity, velocity)
                when = track.start - backtrack
                if not 0.015 <= backtrack <= 0.24 or not frame.time - 0.012 <= when <= frame.time + 0.32:
                    continue
                residual = dist(ball.center, _project(track.ball.center, velocity, -backtrack))
                if residual > max(0.008, ball.radius):
                    continue
                if any(when + 0.06 < after.time <= track.start + 0.09
                       and any(not candidate.motion_only and not candidate.blurred
                               and dist(candidate.center, ball.center) <= rest_radius for candidate in after.balls)
                       for after in frames[i + 1:]):
                    continue
                direction = _scale(velocity, 1 / dist(velocity, (0, 0)))
                window = [sample for sample in frames if abs(sample.time - when) <= 0.13]
                start, end = max(frame.time, when - 0.035), when + 0.035
                foot = (_closest_foot(window, start, end, ball, direction, "occluded")
                        or _unique_foot_crossing(window, start, end, ball, direction))
                if foot is not None:
                    foot_cost, contact = foot
                    cost = foot_cost + 0.25 * track.cost + 10 * residual - 0.2 * ball.confidence
                    matches.append((cost, contact))

    if not matches:
        return None
    matches.sort(key=lambda match: match[0])
    cost, best = matches[0]
    for other_cost, other in matches[1:]:
        if other_cost - cost > 0.15:
            break
        if (abs(best.time - other.time) > 0.12 or best.foot != other.foot
                or dist(best.ball.center, other.ball.center) > max(0.02, 2 * best.ball.radius)):
            return None
    return best
