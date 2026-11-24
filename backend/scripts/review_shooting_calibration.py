"""Compare independent coach reviews with saved CoachAI predictions."""

import argparse
import csv
import json
from pathlib import Path


METRICS = {
    "plant_foot": "Plant Foot Position",
    "body_posture": "Body Posture",
    "follow_through": "Follow-through",
}
STATUSES = {"Strong", "Good", "Needs Work", "Unobservable"}
FOCUSES = {*METRICS.values(), "No clear weakness", "Unobservable"}


def compare(reviews: list[dict[str, str]], predictions: dict[str, dict]) -> dict:
    counts = {label: {"coach_observed": 0, "compared": 0, "matches": 0, "model_missing": 0,
                      "coach_unobservable": 0, "model_scored_unobservable": 0,
                      "coach_needs_work": 0, "model_needs_work": 0, "both_needs_work": 0}
              for label in METRICS.values()}
    focus = {"coach_labeled": 0, "compared": 0, "matches": 0, "model_missing": 0}
    seen = set()
    disagreements = []
    for row in reviews:
        clip, reviewer = row["clip"], row["reviewer"].strip()
        if not any(row[column].strip() for column in (*METRICS, "focus")):
            continue
        if not clip or not reviewer or (clip, reviewer) in seen:
            raise ValueError(f"Each review needs a clip, reviewer and unique reviewer/clip pair: {clip!r}")
        seen.add((clip, reviewer))
        prediction = predictions.get(clip, {})
        for column, label in METRICS.items():
            expected = row[column].strip()
            if not expected:
                continue
            if expected not in STATUSES:
                raise ValueError(f"Invalid {column} label for {clip}: {expected!r}")
            actual = prediction.get("breakdown", {}).get(label)
            metric = counts[label]
            if expected == "Unobservable":
                metric["coach_unobservable"] += 1
                metric["model_scored_unobservable"] += actual is not None
                continue
            metric["coach_observed"] += 1
            if actual is None:
                metric["model_missing"] += 1
            else:
                metric["compared"] += 1
                metric["matches"] += actual == expected
                metric["coach_needs_work"] += expected == "Needs Work"
                metric["model_needs_work"] += actual == "Needs Work"
                metric["both_needs_work"] += actual == expected == "Needs Work"
            if actual != expected:
                disagreements.append({"clip": clip, "reviewer": reviewer, "metric": label, "coach": expected, "model": actual})

        expected_focus = row["focus"].strip()
        if expected_focus and expected_focus not in FOCUSES:
            raise ValueError(f"Invalid focus for {clip}: {expected_focus!r}")
        if expected_focus and expected_focus != "Unobservable":
            focus["coach_labeled"] += 1
            actual_focus = prediction.get("focus")
            if actual_focus is None:
                focus["model_missing"] += 1
            else:
                focus["compared"] += 1
                focus["matches"] += actual_focus == expected_focus
            if actual_focus != expected_focus:
                disagreements.append({"clip": clip, "reviewer": reviewer, "metric": "Recommended focus",
                                      "coach": expected_focus, "model": actual_focus})

    for metric in counts.values():
        metric["agreement"] = rate(metric["matches"], metric["compared"])
        metric["needs_work_precision"] = rate(metric["both_needs_work"], metric["model_needs_work"])
        metric["needs_work_recall"] = rate(metric["both_needs_work"], metric["coach_needs_work"])
    focus["agreement"] = rate(focus["matches"], focus["compared"])
    return {"completed_reviews": len(seen), "metrics": counts, "recommended_focus": focus,
            "disagreements": disagreements}


def rate(matches: int, count: int) -> float | None:
    return round(matches / count, 3) if count else None


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("predictions", type=Path, nargs="+")
    parser.add_argument("--reviews", type=Path, required=True)
    args = parser.parse_args()
    try:
        predictions = {}
        for path in args.predictions:
            for row in json.loads(path.read_text(encoding="utf-8"))["clips"]:
                if row["clip"] in predictions:
                    raise ValueError(f"More than one prediction for {row['clip']}")
                predictions[row["clip"]] = row
        versions = {row["scoring_version"] for row in predictions.values() if row.get("scoring_version")}
        if len(versions) > 1:
            raise ValueError("Compare one scoring version at a time.")
        with args.reviews.open(encoding="utf-8-sig", newline="") as source:
            rows = csv.DictReader(source)
            if not {"clip", "reviewer", *METRICS, "focus"}.issubset(rows.fieldnames or ()):
                raise ValueError("Coach reviews require the columns in samples/shooting-coach-review.csv.")
            report = compare(list(rows), predictions)
        report["scoring_version"] = next(iter(versions), None)
    except (OSError, KeyError, ValueError) as exc:
        parser.error(str(exc))
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
