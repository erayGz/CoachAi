from __future__ import annotations

import argparse
import csv
import json
import mimetypes
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4


PROJECT_ROOT = Path(__file__).resolve().parents[2]
SAMPLES_DIR = PROJECT_ROOT / "samples"
METADATA_PATH = SAMPLES_DIR / "metadata.csv"
DEFAULT_BACKEND_URL = "http://127.0.0.1:8000"
REQUIRED_COLUMNS = {
    "filename",
    "category",
    "expected_validity",
    "expected_confidence",
    "notes",
}


@dataclass
class EvaluationSummary:
    total_tested: int = 0
    passed: int = 0
    failed: int = 0
    missing_files: int = 0
    backend_errors: int = 0
    skipped: int = 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate local CoachAI sample videos against the running backend.")
    parser.add_argument(
        "--backend-url",
        default=DEFAULT_BACKEND_URL,
        help=f"Backend base URL. Default: {DEFAULT_BACKEND_URL}",
    )
    args = parser.parse_args()

    backend_url = args.backend_url.rstrip("/")
    rows = load_metadata_rows()
    if rows is None:
        return 1

    if not rows:
        print("No sample rows found in samples/metadata.csv.")
        print("Add local video files under samples/ and list them in metadata.csv to run evaluation.")
        print_summary(EvaluationSummary())
        return 0

    has_existing_samples = any((SAMPLES_DIR / row["filename"]).exists() for row in rows)
    if has_existing_samples and not backend_is_running(backend_url):
        print(f"Backend is not reachable at {backend_url}.")
        print("Start it first, for example:")
        print("  cd backend")
        print("  uvicorn app.main:app --reload --host 127.0.0.1 --port 8000")
        return 1

    summary = EvaluationSummary()
    print_table_header()

    for row in rows:
        evaluate_row(row, backend_url, summary)

    print_summary(summary)
    return 0 if summary.failed == 0 and summary.backend_errors == 0 and summary.missing_files == 0 else 1


def load_metadata_rows() -> list[dict[str, str]] | None:
    if not METADATA_PATH.exists():
        print(f"Missing metadata file: {METADATA_PATH}")
        return None

    with METADATA_PATH.open(newline="", encoding="utf-8") as metadata_file:
        reader = csv.DictReader(metadata_file)
        if reader.fieldnames is None:
            print("metadata.csv is empty. Expected header:")
            print("filename,category,expected_validity,expected_confidence,notes")
            return None

        missing_columns = REQUIRED_COLUMNS.difference(reader.fieldnames)
        if missing_columns:
            print(f"metadata.csv is missing columns: {', '.join(sorted(missing_columns))}")
            return None

        return [
            {key: (value or "").strip() for key, value in row.items()}
            for row in reader
            if any((value or "").strip() for value in row.values())
        ]


def backend_is_running(backend_url: str) -> bool:
    try:
        with urllib.request.urlopen(f"{backend_url}/health", timeout=5) as response:
            return 200 <= response.status < 300
    except (OSError, urllib.error.URLError, urllib.error.HTTPError):
        return False


def evaluate_row(row: dict[str, str], backend_url: str, summary: EvaluationSummary) -> None:
    filename = row["filename"]
    category = row["category"]
    expected_validity = row["expected_validity"]
    expected_confidence = row["expected_confidence"]
    sample_path = SAMPLES_DIR / filename

    if not sample_path.exists():
        summary.missing_files += 1
        print_table_row(
            filename,
            category,
            expected_validity,
            "missing",
            expected_confidence,
            "missing",
            "--",
            "--",
            "--",
            "MISSING",
        )
        return

    try:
        result = analyze_sample(sample_path, backend_url)
    except urllib.error.HTTPError as exc:
        summary.backend_errors += 1
        error_detail = read_error_detail(exc)
        print_table_row(
            filename,
            category,
            expected_validity,
            "backend error",
            expected_confidence,
            "backend error",
            "--",
            "--",
            "--",
            f"ERROR: {error_detail}",
        )
        return
    except (OSError, urllib.error.URLError) as exc:
        summary.backend_errors += 1
        print_table_row(
            filename,
            category,
            expected_validity,
            "request error",
            expected_confidence,
            "request error",
            "--",
            "--",
            "--",
            f"ERROR: {exc}",
        )
        return

    summary.total_tested += 1
    actual_validity = get_nested_value(result, "drillValidityReport", "status") or "--"
    actual_confidence = result.get("analysisConfidence") or get_nested_value(result, "drillValidityReport", "confidence") or "--"
    score = str(result.get("overallScore", "--"))
    pose_quality = get_nested_value(result, "poseAnalysis", "poseQuality") or "--"
    warnings_count = str(len(get_nested_value(result, "videoQualityReport", "warnings") or []))
    expectation_result = get_expectation_result(
        expected_validity,
        actual_validity,
        expected_confidence,
        actual_confidence,
    )

    if expectation_result == "PASS":
        summary.passed += 1
    elif expectation_result == "FAIL":
        summary.failed += 1
    else:
        summary.skipped += 1

    print_table_row(
        filename,
        category,
        expected_validity,
        actual_validity,
        expected_confidence,
        actual_confidence,
        score,
        pose_quality,
        warnings_count,
        expectation_result,
    )


def analyze_sample(sample_path: Path, backend_url: str) -> dict:
    boundary = f"----coachai-{uuid4().hex}"
    content_type = mimetypes.guess_type(sample_path.name)[0] or "application/octet-stream"
    file_bytes = sample_path.read_bytes()
    body = build_multipart_body(boundary, sample_path.name, content_type, file_bytes)
    request = urllib.request.Request(
        f"{backend_url}/analyze/shooting",
        data=body,
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Content-Length": str(len(body)),
        },
        method="POST",
    )

    with urllib.request.urlopen(request, timeout=120) as response:
        return json.loads(response.read().decode("utf-8"))


def build_multipart_body(boundary: str, filename: str, content_type: str, file_bytes: bytes) -> bytes:
    lines = [
        f"--{boundary}\r\n".encode("utf-8"),
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode("utf-8"),
        f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"),
        file_bytes,
        b"\r\n",
        f"--{boundary}--\r\n".encode("utf-8"),
    ]
    return b"".join(lines)


def read_error_detail(exc: urllib.error.HTTPError) -> str:
    try:
        payload = json.loads(exc.read().decode("utf-8"))
        detail = payload.get("detail")
        return str(detail) if detail else f"HTTP {exc.code}"
    except (OSError, json.JSONDecodeError, UnicodeDecodeError):
        return f"HTTP {exc.code}"


def get_nested_value(payload: dict, *keys: str):
    current = payload
    for key in keys:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def get_expectation_result(
    expected_validity: str,
    actual_validity: str,
    expected_confidence: str,
    actual_confidence: str,
) -> str:
    checks = []
    if expected_validity:
        checks.append(expected_validity == actual_validity)
    if expected_confidence:
        checks.append(expected_confidence == actual_confidence)

    if not checks:
        return "SKIP"
    return "PASS" if all(checks) else "FAIL"


def print_table_header() -> None:
    print(
        format_row(
            "filename",
            "category",
            "expected_validity",
            "actual_validity",
            "expected_confidence",
            "actual_confidence",
            "score",
            "poseQuality",
            "warnings",
            "result",
        )
    )
    print("-" * 164)


def print_table_row(
    filename: str,
    category: str,
    expected_validity: str,
    actual_validity: str,
    expected_confidence: str,
    actual_confidence: str,
    score: str,
    pose_quality: str,
    warnings_count: str,
    result: str,
) -> None:
    print(
        format_row(
            filename,
            category,
            expected_validity or "--",
            actual_validity,
            expected_confidence or "--",
            actual_confidence,
            score,
            pose_quality,
            warnings_count,
            result,
        )
    )


def format_row(
    filename: str,
    category: str,
    expected_validity: str,
    actual_validity: str,
    expected_confidence: str,
    actual_confidence: str,
    score: str,
    pose_quality: str,
    warnings_count: str,
    result: str,
) -> str:
    return (
        f"{trim(filename, 32):32} "
        f"{trim(category, 10):10} "
        f"{trim(expected_validity, 18):18} "
        f"{trim(actual_validity, 16):16} "
        f"{trim(expected_confidence, 19):19} "
        f"{trim(actual_confidence, 17):17} "
        f"{trim(score, 5):5} "
        f"{trim(pose_quality, 11):11} "
        f"{trim(warnings_count, 8):8} "
        f"{result}"
    )


def trim(value: str, width: int) -> str:
    value = str(value)
    if len(value) > width:
        return value[: width - 3] + "..."
    return value.ljust(width)


def print_summary(summary: EvaluationSummary) -> None:
    print()
    print("Summary")
    print(f"total tested: {summary.total_tested}")
    print(f"passed expectations: {summary.passed}")
    print(f"failed expectations: {summary.failed}")
    print(f"missing files: {summary.missing_files}")
    print(f"invalid duration/backend errors: {summary.backend_errors}")
    print(f"skipped expectations: {summary.skipped}")


if __name__ == "__main__":
    sys.exit(main())
