# CoachAI Sample Dataset Intake

This folder is for local-only football training clips used to prepare CoachAI for future model training, calibration, and validation.

Video files are ignored by Git. Do not commit sample videos.

## Folder Structure

```text
samples/
  metadata.csv
  incoming/
  invalid/
  bad/
  medium/
  good/
```

## Folder Meaning

### `incoming`

Raw or unprocessed external samples from dataset providers. These clips may not be reviewed, labeled, or approved yet.

### `bad`

Usable football samples with bad technique, poor recording quality, or difficult framing.

### `medium`

Usable football samples with acceptable technique or recording quality, but not ideal.

### `good`

Usable football samples with clear technique, strong recording quality, and useful framing.

### `invalid`

Unusable samples, permission problems, unclear videos, wrong duration, missing metadata, broken files, or clips outside the expected football movement scope.

## Accepted Sample Rules

- 3-15 seconds
- Single player preferred
- Single football action or drill preferred
- Ball and lower body should be visible when possible
- Stable camera preferred
- No private or sensitive content
- Permission or consent is required before use
- Labels should be `bad`, `medium`, `good`, `unlabeled`, or `invalid`

## metadata.csv

`metadata.csv` tracks source, permission, labels, movement type, camera angle, duration, and review confidence.

Required header:

```csv
file_name,relative_path,source,permission_status,movement_type,quality_label,camera_angle,duration_seconds,player_age_group,analysis_confidence,notes
```

Allowed values:

- `source`: `manual_sample`, `provider_pending`, `provider_approved`, `synthetic_demo`, `unknown`
- `permission_status`: `approved`, `pending`, `rejected`, `internal_demo_only`, `unknown`
- `movement_type`: `shooting`, `passing`, `dribbling`, `sprinting`, `ball_control`, `agility`, `unknown`
- `quality_label`: `bad`, `medium`, `good`, `unlabeled`, `invalid`
- `camera_angle`: `front`, `side`, `rear`, `diagonal`, `unknown`
- `player_age_group`: `u12`, `u14`, `u16`, `u18`, `adult`, `unknown`
- `analysis_confidence`: `high`, `medium`, `low`, `unknown`

## Dataset Provider Workflow

1. Put raw files in `samples/incoming/`.
2. Add rows to `samples/metadata.csv`.
3. Run the validation script.
4. Review warnings.
5. Move usable clips into `bad/`, `medium/`, or `good/`.
6. Move unusable clips into `invalid/`.
7. Keep `source` and `permission_status` updated.

## Validation

Run:

```bash
python backend/scripts/evaluate_samples.py
```

The validator checks metadata structure, allowed values, path/label consistency, duration ranges, permission status, missing files, and files missing metadata. Normal dataset warnings do not fail the script. Serious structural problems, such as missing `metadata.csv` or required columns, return a non-zero exit code.

## Privacy And Consent

Use local test clips only. Do not upload personal, private, sensitive, or child videos without clear consent from the player or guardian. Do not add provider details unless the provider has approved that information for project use.
