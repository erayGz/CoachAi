from setup_pose_model import MODEL_DIR, MODELS, file_digest


def main() -> int:
    all_valid = True
    for name, (_, checksum) in MODELS.items():
        path = MODEL_DIR / name
        try:
            valid = path.is_file() and file_digest(path) == checksum
        except OSError:
            valid = False
        print(f"{name}: {'verified' if valid else 'missing or invalid'}")
        all_valid = all_valid and valid
    if not all_valid:
        print("Run python scripts/setup_pose_model.py from backend to install the models.")
    return 0 if all_valid else 1


if __name__ == "__main__":
    raise SystemExit(main())
