# CoachAI Local Samples

This folder is for local-only evaluation videos used to calibrate CoachAI's single-shot shooting analysis flow.

Video files in this folder are ignored by Git. Do not commit sample videos.

## Folder Structure

```text
samples/
  metadata.csv
  invalid/
  bad/
  medium/
  good/
```

## Categories

### `invalid`

Use for clips that should not be treated as a valid shooting drill:

- Not a football shooting video
- No clear player
- No shot action
- Wrong duration
- Broken or unreadable video

Expected outcome: usually `Invalid` with `Low` confidence.

### `bad`

Use for shooting clips with major recording issues:

- Shooting video exists but poor framing
- Body partially visible
- Camera shaky
- Ball or kicking leg hard to see

Expected outcome: usually `Unclear` or `Low` confidence.

### `medium`

Use for usable but imperfect shooting clips:

- Mostly visible player
- Ball visible
- Acceptable angle

Expected outcome: usually `Unclear` or `Valid` with `Medium` confidence.

### `good`

Use for clear single-shot football clips:

- Full body visible
- Ball and kicking leg visible
- Fixed camera
- Side or 45-degree angle

Expected outcome: usually `Valid` with `Medium` or `High` confidence.

## metadata.csv

`metadata.csv` tracks expected outcomes manually. Keep it clean CSV with this header:

```csv
filename,category,expected_validity,expected_confidence,notes
```

Example rows:

```csv
invalid/random-park-clip.mp4,invalid,Invalid,Low,No football shot action
bad/cropped-shot.mov,bad,Unclear,Medium,Player is partially cropped
medium/usable-side-angle.mp4,medium,Unclear,Medium,Ball visible but pose confidence varies
good/clear-single-shot.mp4,good,Valid,High,Full body and ball visible
```

## Privacy

Use local test clips only. Do not upload personal or child videos without clear consent from the player or guardian.

## Evaluation

Run the backend first, then use:

```bash
python backend/scripts/evaluate_samples.py
```

Optional backend URL:

```bash
python backend/scripts/evaluate_samples.py --backend-url http://127.0.0.1:8000
```
