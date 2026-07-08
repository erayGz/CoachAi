from __future__ import annotations

import csv
import sys
from dataclasses import dataclass, field
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
SAMPLES_DIR = PROJECT_ROOT / "samples"
METADATA_PATH = SAMPLES_DIR / "metadata.csv"
SCAN_FOLDERS = ("incoming", "invalid", "bad", "medium", "good")
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}

REQUIRED_COLUMNS = [
    "file_name",
    "relative_path",
    "source",
    "permission_status",
    "movement_type",
    "quality_label",
    "camera_angle",
    "duration_seconds",
    "player_age_group",
    "analysis_confidence",
    "notes",
]

ALLOWED_VALUES = {
    "source": {"manual_sample", "provider_pending", "provider_approved", "synthetic_demo", "unknown"},
    "permission_status": {"approved", "pending", "rejected", "internal_demo_only", "unknown"},
    "movement_type": {"shooting", "passing", "dribbling", "sprinting", "ball_control", "agility", "unknown"},
    "quality_label": {"bad", "medium", "good", "unlabeled", "invalid"},
    "camera_angle": {"front", "side", "rear", "diagonal", "unknown"},
    "player_age_group": {"u12", "u14", "u16", "u18", "adult", "unknown"},
    "analysis_confidence": {"high", "medium", "low", "unknown"},
}

FOLDER_LABELS = {
    "bad": {"bad"},
    "medium": {"medium"},
    "good": {"good"},
    "incoming": {"unlabeled"},
    "invalid": {"invalid"},
}


@dataclass
class DatasetSummary:
    total_metadata_rows: int = 0
    files_scanned: int = 0
    valid_usable_samples: int = 0
    incoming_samples: int = 0
    invalid_samples: int = 0
    missing_files: int = 0
    files_missing_metadata: int = 0
    duration_warnings: int = 0
    permission_warnings: int = 0
    label_path_warnings: int = 0
    value_warnings: int = 0
    row_warnings: int = 0
    notes: list[str] = field(default_factory=list)


def main() -> int:
    try:
        rows = load_metadata_rows()
    except DatasetStructureError as exc:
        print("Dataset Check Report")
        print(f"ERROR: {exc}")
        return 1

    summary = DatasetSummary(total_metadata_rows=len(rows))
    metadata_paths = validate_rows(rows, summary)
    scan_files(metadata_paths, summary)
    print_report(summary)
    return 0


def load_metadata_rows() -> list[dict[str, str]]:
    if not METADATA_PATH.exists():
        raise DatasetStructureError(f"Missing metadata file: {METADATA_PATH}")

    try:
        with METADATA_PATH.open(newline="", encoding="utf-8") as metadata_file:
            reader = csv.DictReader(metadata_file)
            if reader.fieldnames is None:
                raise DatasetStructureError("metadata.csv is empty or unreadable.")

            missing_columns = [column for column in REQUIRED_COLUMNS if column not in reader.fieldnames]
            if missing_columns:
                raise DatasetStructureError(f"metadata.csv is missing required columns: {', '.join(missing_columns)}")

            return [
                {key: (value or "").strip() for key, value in row.items()}
                for row in reader
                if any((value or "").strip() for value in row.values())
            ]
    except OSError as exc:
        raise DatasetStructureError(f"Could not read metadata.csv: {exc}") from exc
    except csv.Error as exc:
        raise DatasetStructureError(f"Could not parse metadata.csv: {exc}") from exc


def validate_rows(rows: list[dict[str, str]], summary: DatasetSummary) -> set[str]:
    metadata_paths: set[str] = set()

    for row_number, row in enumerate(rows, start=2):
        file_name = row["file_name"]
        relative_path = normalize_relative_path(row["relative_path"])

        if not file_name:
            add_note(summary, "row", row_number, "Missing file_name.")

        if not relative_path:
            add_note(summary, "row", row_number, "Missing relative_path.")
            continue

        metadata_paths.add(relative_path)
        path = SAMPLES_DIR / relative_path
        folder = get_top_level_folder(relative_path)

        if file_name and Path(relative_path).name != file_name:
            add_note(summary, "row", row_number, f"file_name does not match relative_path filename: {relative_path}.")

        if folder not in SCAN_FOLDERS:
            add_label_warning(summary, row_number, f"relative_path should start with one of {', '.join(SCAN_FOLDERS)}.")

        if should_expect_file(row) and not path.exists():
            summary.missing_files += 1
            add_note(summary, "missing", row_number, f"Referenced file does not exist: samples/{relative_path}.")

        validate_allowed_values(row, row_number, summary)
        validate_duration(row, row_number, folder, summary)
        validate_permission(row, row_number, folder, summary)
        validate_label_path(row, row_number, folder, summary)
        update_counts(row, folder, summary)

    return metadata_paths


def validate_allowed_values(row: dict[str, str], row_number: int, summary: DatasetSummary) -> None:
    for column, allowed in ALLOWED_VALUES.items():
        value = row[column]
        if not value:
            summary.value_warnings += 1
            add_note(summary, "value", row_number, f"Missing {column}; expected one of {sorted_values(allowed)}.")
            continue

        if value not in allowed:
            summary.value_warnings += 1
            add_note(summary, "value", row_number, f"Invalid {column} '{value}'; expected one of {sorted_values(allowed)}.")


def validate_duration(row: dict[str, str], row_number: int, folder: str, summary: DatasetSummary) -> None:
    duration_raw = row["duration_seconds"]
    quality_label = row["quality_label"]
    is_placeholder = folder == "incoming" or quality_label == "unlabeled" or row["source"] in {"provider_pending", "unknown"}
    is_usable_sample = folder in {"bad", "medium", "good"} and quality_label in {"bad", "medium", "good"}

    if not duration_raw:
        if is_placeholder:
            add_note(summary, "duration", row_number, "duration_seconds is unknown for placeholder or incoming sample.")
            return

        summary.duration_warnings += 1
        add_note(summary, "duration", row_number, "Missing duration_seconds.")
        return

    try:
        duration = float(duration_raw)
    except ValueError:
        summary.duration_warnings += 1
        add_note(summary, "duration", row_number, f"duration_seconds is not numeric: '{duration_raw}'.")
        return

    if duration <= 0:
        summary.duration_warnings += 1
        add_note(summary, "duration", row_number, "duration_seconds must be greater than 0.")
        return

    if is_usable_sample and not 3 <= duration <= 15:
        summary.duration_warnings += 1
        add_note(summary, "duration", row_number, "Usable samples should be 3-15 seconds.")


def validate_permission(row: dict[str, str], row_number: int, folder: str, summary: DatasetSummary) -> None:
    permission_status = row["permission_status"]
    quality_label = row["quality_label"]
    is_usable_sample = folder in {"bad", "medium", "good"} and quality_label in {"bad", "medium", "good"}

    if permission_status in {"pending", "rejected", "unknown"}:
        summary.permission_warnings += 1
        add_note(summary, "permission", row_number, f"permission_status is {permission_status}.")

    if is_usable_sample and permission_status not in {"approved", "internal_demo_only"}:
        summary.permission_warnings += 1
        add_note(summary, "permission", row_number, "Usable labeled samples need approved or internal_demo_only permission.")


def validate_label_path(row: dict[str, str], row_number: int, folder: str, summary: DatasetSummary) -> None:
    if folder not in FOLDER_LABELS:
        return

    quality_label = row["quality_label"]
    allowed_labels = FOLDER_LABELS[folder]
    if quality_label not in allowed_labels:
        add_label_warning(
            summary,
            row_number,
            f"quality_label '{quality_label}' does not match samples/{folder}/ expectations: {sorted_values(allowed_labels)}.",
        )


def update_counts(row: dict[str, str], folder: str, summary: DatasetSummary) -> None:
    quality_label = row["quality_label"]
    permission_status = row["permission_status"]

    if folder == "incoming":
        summary.incoming_samples += 1

    if folder == "invalid" or quality_label == "invalid":
        summary.invalid_samples += 1

    if (
        folder in {"bad", "medium", "good"}
        and quality_label in {"bad", "medium", "good"}
        and permission_status in {"approved", "internal_demo_only"}
    ):
        summary.valid_usable_samples += 1


def scan_files(metadata_paths: set[str], summary: DatasetSummary) -> None:
    if not SAMPLES_DIR.exists():
        return

    for folder in SCAN_FOLDERS:
        folder_path = SAMPLES_DIR / folder
        if not folder_path.exists():
            continue

        for file_path in folder_path.rglob("*"):
            if not file_path.is_file() or file_path.name == ".gitkeep":
                continue

            relative_path = normalize_relative_path(str(file_path.relative_to(SAMPLES_DIR)))
            if file_path.suffix.lower() in VIDEO_EXTENSIONS:
                summary.files_scanned += 1

            if relative_path not in metadata_paths:
                summary.files_missing_metadata += 1
                summary.notes.append(f"[metadata] File missing metadata row: samples/{relative_path}")


def should_expect_file(row: dict[str, str]) -> bool:
    permission_status = row["permission_status"]
    source = row["source"]
    quality_label = row["quality_label"]

    if source in {"provider_pending", "unknown"} and permission_status in {"pending", "unknown"}:
        return False

    if quality_label == "unlabeled" and permission_status == "pending":
        return False

    return True


def normalize_relative_path(path: str) -> str:
    return path.replace("\\", "/").strip().lstrip("/")


def get_top_level_folder(relative_path: str) -> str:
    return normalize_relative_path(relative_path).split("/", 1)[0] if relative_path else ""


def add_note(summary: DatasetSummary, kind: str, row_number: int, message: str) -> None:
    if kind == "row":
        summary.row_warnings += 1
    summary.notes.append(f"[{kind}] row {row_number}: {message}")


def add_label_warning(summary: DatasetSummary, row_number: int, message: str) -> None:
    summary.label_path_warnings += 1
    add_note(summary, "label/path", row_number, message)


def sorted_values(values: set[str]) -> str:
    return ", ".join(sorted(values))


def print_report(summary: DatasetSummary) -> None:
    print("Dataset Check Report")
    print(f"Total metadata rows: {summary.total_metadata_rows}")
    print(f"Files scanned: {summary.files_scanned}")
    print(f"Valid usable samples: {summary.valid_usable_samples}")
    print(f"Incoming samples: {summary.incoming_samples}")
    print(f"Invalid samples: {summary.invalid_samples}")
    print(f"Missing files: {summary.missing_files}")
    print(f"Files missing metadata: {summary.files_missing_metadata}")
    print(f"Duration warnings: {summary.duration_warnings}")
    print(f"Permission warnings: {summary.permission_warnings}")
    print(f"Label/path warnings: {summary.label_path_warnings}")
    print(f"Value warnings: {summary.value_warnings}")
    print(f"Row warnings: {summary.row_warnings}")

    if summary.notes:
        print()
        print("Warnings")
        for note in summary.notes:
            print(f"- {note}")


class DatasetStructureError(Exception):
    pass


if __name__ == "__main__":
    sys.exit(main())
