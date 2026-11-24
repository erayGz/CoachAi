"""Evaluate shot detection and contact timing on locally labeled, unmodified clips."""

import argparse
from bisect import bisect_left
from collections import Counter, defaultdict
import csv
import json
import mimetypes
from pathlib import Path
from statistics import mean, median
import sys

from fastapi import HTTPException

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import _analyze_video
from app.models import UploadedFileMetadata
from app.shot_detection import UnscorableShotError
from app.video_processing import InvalidVideoError, VideoMetadataExtractionError, extract_video_timeline


DEFAULT_MANIFEST = Path(__file__).resolve().parents[2] / "samples" / "shooting-evaluation.csv"


def read_touch_frames(path: Path) -> dict[str, list[int]]:
    touches: dict[str, list[int]] = defaultdict(list)
    with path.open(encoding="utf-8-sig", newline="") as source:
        rows = csv.DictReader(source)
        if not {"kick_id", "frame", "last_touch"}.issubset(rows.fieldnames or ()):
            raise ValueError("Annotations require kick_id, frame and last_touch columns.")
        for row in rows:
            if row["last_touch"].strip() in {"1", "1.0"}:
                touches[row["kick_id"].strip()].append(int(row["frame"]))
    return touches


def read_manifest(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as source:
        rows = list(csv.DictReader(source))
    if not rows:
        raise ValueError("The evaluation manifest has no clips.")
    seen = set()
    players = {}
    for row in rows:
        clip, split, player = row["clip"], row["split"], row["player_id"]
        if not clip or clip in seen or split not in {"regression", "holdout"}:
            raise ValueError(f"Invalid clip or split: {clip!r}, {split!r}")
        if not player or players.setdefault(player, split) != split:
            raise ValueError(f"Player must belong to exactly one split: {player!r}")
        if row["expected"] not in {"shot", "no_shot"} or row["kicking_foot"] not in {"", "left", "right"}:
            raise ValueError(f"Invalid ground truth for {clip}")
        start, end = row["raw_contact_start_frame"], row["raw_contact_end_frame"]
        if bool(start) != bool(end) or (start and not 0 <= int(start) <= int(end)):
            raise ValueError(f"Invalid raw contact interval for {clip}")
        if row["expected"] == "no_shot" and (start or row["kick_id"] or row["kicking_foot"]):
            raise ValueError(f"A no-shot clip cannot have a contact or kicking foot: {clip}")
        seen.add(clip)
    return rows


def nearest_frame(times: tuple[float, ...], time: float) -> int:
    index = bisect_left(times, time)
    return min((max(0, index - 1), min(index, len(times) - 1)), key=lambda i: abs(times[i] - time))


def evaluate_clip(row: dict[str, str], root: Path, touches: dict[str, list[int]], tolerance: int) -> dict:
    path = root / row["clip"]
    result = {"clip": row["clip"], "split": row["split"], "expected": row["expected"],
              "expected_foot": row["kicking_foot"] or None}
    try:
        upload = UploadedFileMetadata(filename=path.name, contentType=mimetypes.guess_type(path)[0] or "video/mp4",
                                      fileSizeBytes=path.stat().st_size)
        timeline = extract_video_timeline(str(path))
    except (OSError, InvalidVideoError, VideoMetadataExtractionError) as exc:
        return {**result, "outcome": "error", "detail": str(exc)}
    times = timeline.frame_times

    start_frame, end_frame = row["raw_contact_start_frame"], row["raw_contact_end_frame"]
    manual = (int(start_frame), int(end_frame)) if start_frame and end_frame else None
    marked = touches.get(row["kick_id"], [])
    csv_frame = marked[0] if len(marked) == 1 and 0 <= marked[0] < len(times) else None
    reference = manual if manual else ((csv_frame, csv_frame) if csv_frame is not None else None)
    if reference is not None and not 0 <= reference[0] <= reference[1] < len(times):
        return {**result, "outcome": "error", "detail": "Reference frames are outside the decoded video."}
    result.update(csv_touch_frames=marked, csv_contact_seconds=times[csv_frame] if csv_frame is not None else None,
                  reference_frames=reference, reference_source="manual" if manual else "csv" if reference else None,
                  csv_matches_manual=manual[0] <= csv_frame <= manual[1] if manual and csv_frame is not None else None,
                  reference_seconds=[times[i] for i in reference] if reference else None)

    prediction = {"outcome": "detected_shot" if row["expected"] == "shot" else "false_detection"}
    try:
        analysis = _analyze_video(str(path), upload, timeline=timeline)
    except HTTPException as exc:
        cause = exc.__cause__
        contact = cause.contact if isinstance(cause, UnscorableShotError) else None
        if exc.status_code != 422 or contact is None:
            outcome = "missed_shot" if row["expected"] == "shot" else "true_negative"
            return {**result, "outcome": outcome if exc.status_code == 422 else "error",
                    "status": exc.status_code, "detail": exc.detail}
        time, foot = contact.time, contact.foot
        prediction.update(status=exc.status_code, detail=exc.detail)
    else:
        shot = analysis.shotMeasurements
        if shot is None:
            return {**result, "outcome": "error", "detail": "Successful response did not include shot measurements."}
        time, foot = shot.contactTimeSeconds, shot.kickingFoot
        prediction.update(
            status=200, scoring_version=analysis.scoringVersion, score=analysis.overallScore,
            coverage=[len(analysis.technicalBreakdown), analysis.techniqueMetricsTotal], focus=analysis.mainFocus,
            breakdown={part.label: part.status for part in analysis.technicalBreakdown}, measurements=shot.model_dump(),
        )
    predicted = nearest_frame(times, time)
    result.update(prediction, predicted_frame=predicted, contact_seconds=round(time, 3), kicking_foot=foot)
    if reference is not None and row["expected"] == "shot":
        start, end = reference
        offset = predicted - min(max(predicted, start), end)
        time_error = time - min(max(time, times[start]), times[end])
        result.update(frame_offset=offset, contact_error_ms=round(time_error * 1000, 1),
                      within_tolerance=abs(offset) <= tolerance)
    return result


def summarize(results: list[dict], tolerance: int) -> dict:
    timings = [row for row in results if "frame_offset" in row]
    offsets = [abs(row["frame_offset"]) for row in timings]
    feet = [row for row in results if row["outcome"] == "detected_shot" and row["expected_foot"]]
    counts = Counter(row["outcome"] for row in results)
    return {"clips": len(results), "detected_shots": counts["detected_shot"], "missed_shots": counts["missed_shot"],
            "detected_unscorable": sum(row["outcome"] == "detected_shot" and row["status"] == 422 for row in results),
            "false_detections": counts["false_detection"], "true_negatives": counts["true_negative"], "errors": counts["error"],
            "timing_samples": len(timings), "mean_absolute_frame_error": round(mean(offsets), 2) if offsets else None,
            "median_absolute_frame_error": median(offsets) if offsets else None,
            "median_absolute_error_ms": round(median(abs(row["contact_error_ms"]) for row in timings), 1) if timings else None,
            "frame_tolerance": tolerance, "within_tolerance": sum(row["within_tolerance"] for row in timings),
            "foot_matches": sum(row["kicking_foot"] == row["expected_foot"] for row in feet), "foot_samples": len(feet)}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--video-root", type=Path, required=True)
    parser.add_argument("--annotations", type=Path, help="Mendeley penalty_pose_keypoints.csv")
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--split", choices=("regression", "holdout"), default="regression")
    parser.add_argument("--frame-tolerance", type=int, default=2)
    parser.add_argument("--strict", action="store_true", help="Fail on misses, false detections, timing or foot errors.")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.frame_tolerance < 0:
        parser.error("--frame-tolerance must be nonnegative")
    try:
        rows = [row for row in read_manifest(args.manifest) if row["split"] == args.split]
        touches = read_touch_frames(args.annotations) if args.annotations else {}
    except (OSError, ValueError, KeyError) as exc:
        parser.error(str(exc))
    if not rows:
        parser.error("No clips for the selected split.")
    results = []
    for row in rows:
        result = evaluate_clip(row, args.video_root, touches, args.frame_tolerance)
        results.append(result)
        print(json.dumps(result, ensure_ascii=False), flush=True)
    summary = summarize(results, args.frame_tolerance)
    args.output.write_text(json.dumps({"summary": summary, "clips": results}, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))
    failures = (summary["missed_shots"] + summary["false_detections"]
                + summary["timing_samples"] - summary["within_tolerance"]
                + summary["foot_samples"] - summary["foot_matches"])
    return int(summary["errors"] > 0 or (args.strict and failures > 0))


if __name__ == "__main__":
    raise SystemExit(main())
