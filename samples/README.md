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

- 1–15 seconds
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

## Shooting Contact and Coaching Evaluation

Feiting Li and Nathan David Pifer’s Women’s Soccer Penalty Kick Data v2 provides raw videos and frame-level pose annotations. Download `penalty_pose_keypoints.csv` separately from the videos. `shooting-evaluation.csv` keeps ten regression clips and a holdout from four different `kicker` IDs. The holdout also includes two pre-strike clips and a horizontally mirrored strike as controls. The published CSV has right-footed labels throughout. Collect independently recorded left-footed strikes, phone footage and non-shooting actions before making claims about those groups. [Dataset](https://data.mendeley.com/datasets/compare/brx9bsxnpx) · [Download the published CSV](https://data.mendeley.com/public-files/datasets/brx9bsxnpx/files/96a3af04-daa7-481d-8154-863c0e36346d/file_downloaded)

```powershell
$python = '.\backend\.venv\Scripts\python.exe'
$raw = 'C:\path\to\Women_Players_Videos'
$labels = 'C:\path\to\penalty_pose_keypoints.csv'
$holdout = '.\samples\shooting-holdout'
& $python backend\scripts\evaluate_contacts.py --video-root $raw --annotations $labels --strict --output regression-results.json
& $python backend\scripts\prepare_shooting_holdout.py $raw $holdout
& $python backend\scripts\evaluate_contacts.py --video-root $holdout --annotations $labels --split holdout --output holdout-results.json
```

The runner accepts a custom manifest for new players and camera setups. It maps a unique `last_touch` frame to the corresponding decoded raw frame timestamp and retains competing markers for inspection. Hand-reviewed, zero-based raw frame windows take precedence when present. For example, the published marker for `05-04` is frame 49, while the visible contact is between frames 50 and 51. `11-02` has no published marker. The report separates missed shots, false detections, verified contacts without a usable technique score, decoding or service errors, contact frame deviations and kicking-foot agreement. Frame error is measured to the nearest edge of the labeled interval, with zero error inside it. The regression positives provide no false-detection denominator.

For technical calibration, have a coach review the six clips in `shooting-coach-review.csv` without seeing CoachAI’s results. At the strike, assess support-foot placement and torso posture relative to the shot. After the strike, assess the kicking leg’s finish. Mark each visible category `Strong`, `Good` or `Needs Work`. Use `Unobservable` when the camera view or occlusion prevents a judgment. Set `focus` to one technique category, `No clear weakness` or `Unobservable`. Leave an empty cell for a judgment that has yet to be made. Use a reviewer identifier rather than personal information.

```powershell
& $python backend\scripts\review_shooting_calibration.py regression-results.json holdout-results.json --reviews samples\shooting-coach-review.csv
```

The report shows exact category agreement, missed assessments, `Needs Work` precision and recall among comparable labels, and agreement on recommended focus. It also flags coaches’ `Unobservable` judgments that received a model score. Use these counts and the disagreements to revise the rubric, then repeat the comparison on clips reserved for evaluation. The coach review file starts with empty ratings.

## Privacy And Consent

Use local test clips only. Do not upload personal, private, sensitive, or child videos without clear consent from the player or guardian. Do not add provider details unless the provider has approved that information for project use.
