# CoachAI

CoachAI is a mobile-first football coaching app. Its first module, **Shooting Lab**, analyzes a short video of one shot and returns a technique breakdown, feedback, and a practice drill when it identifies an area to work on. Inference runs on the local CPU with pre-trained MediaPipe models and requires no API key or paid service.

## How Shot Analysis Works

1. FastAPI validates the upload. OpenCV decodes the video and uses the frame timestamps to measure duration and estimate when contact occurred.
2. MediaPipe estimates the player’s pose and detects the ball. CoachAI links ball observations before and after the strike and checks them against foot movement. A local retry can zoom in around a kick in a wide view and recover a track across a brief detection gap.
3. The `shooting-2d-v1` rubric scores support-foot placement, torso tilt, and follow-through from the available 2D measurements. The report shows how many measurements contribute to the score and can recommend a drill for the lowest-scoring area.

Keep the whole player and the ball visible around the kick. The app accepts clips from **1 to 15 seconds** and up to **100 MB**. It returns a retake message when it cannot verify the strike or measure enough of the technique. See the [backend documentation](backend/README.md) for the metric definitions and API responses.

## Main Features

- Mobile-first / PWA-style layout
- Shooting video upload
- Video file validation
- 1–15 second duration validation
- Processing flow
- Deterministic technique scoring and training advice from an uploaded video
- FastAPI analysis API
- OpenCV video metadata extraction
- Lightweight sampled frame metadata
- MediaPipe pose estimation and ball tracking
- A contact estimate based on foot proximity and ball movement
- Local-only samples dataset and evaluation runner
- Dataset intake metadata validation
- Analysis confidence labels
- Backend duration validation
- Metadata-aware video quality and reliability
- Results screen
- Local history tracking
- Profile stats from saved analyses
- History filters
- Local XP, levels, quests, and badges
- Shooting Skill Tree and training path
- Adaptive weekly training plan

## Tech Stack

- React
- Vite
- TypeScript
- CSS
- localStorage
- FastAPI
- OpenCV
- MediaPipe Tasks

## How To Run

One-time setup from the project root on Windows:

```powershell
npm.cmd install
python -m venv backend\.venv
.\backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.\backend\.venv\Scripts\python.exe backend\scripts\setup_pose_model.py
```

On macOS or Linux, run `npm install` and follow the virtual environment setup in the [backend README](backend/README.md#setup).

Start both the Vite frontend and the FastAPI backend from the project root:

```powershell
npm.cmd run dev
```

On macOS or Linux, use `npm run dev`. Open http://127.0.0.1:5173/. The API runs at http://127.0.0.1:8000. Press Ctrl+C to stop both servers. Restart the command after editing Python code.

The frontend uses `VITE_API_BASE_URL` when set and defaults to `http://127.0.0.1:8000`. To build the frontend, run `npm run build`. FastAPI serves interactive API documentation at `http://127.0.0.1:8000/docs`.

Backend endpoints:

- `GET /`
- `GET /health`
- `POST /analyze/shooting`

`POST /analyze/shooting` accepts a multipart `video/*` upload in the `file` field and deletes its temporary copy after processing. Successful responses include `shotMeasurements`, `scoringVersion`, technique coverage, feedback, and recommendations.

## Evaluation Results

The contact evaluator aligns published `last_touch` markers from the Women’s Soccer Penalty Kick Data with decoded video timestamps. It reports missed shots, false detections, frame error against reviewed contact intervals, and kicking-foot agreement. [Dataset source](https://data.mendeley.com/datasets/compare/brx9bsxnpx)

| Evaluation set | Result |
| --- | --- |
| 10 regression clips | 10/10 shots detected, up from 8/10. All estimated contacts fell within the reviewed frame intervals and all kicking feet matched. |
| Four raw shots from held-out players | 2/4 shots detected. |
| Two trimmed pre-strike controls | 0/2 false detections. |
| One horizontally mirrored left-foot control | 0/1 shots detected. |

These small sets measure contact detection. Technique scores use provisional thresholds. A partial score of 100 means the average of the available subscores rounded to 100. Independent coach reviews are needed to calibrate technique feedback and drill recommendations. See the [reproduction steps and coach review workflow](samples/README.md#shooting-contact-and-coaching-evaluation).

Run the backend unit tests from the project root on Windows.

```powershell
Push-Location backend
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
Pop-Location
```

## Dataset Intake And Validation

CoachAI can prepare incoming external football training clips before real model training. Samples are tracked with `samples/metadata.csv`, including source, permission status, movement type, quality label, camera angle, duration, and review confidence.

Local clips can be organized under `samples/`:

```text
samples/incoming/
samples/invalid/
samples/bad/
samples/medium/
samples/good/
```

Video files in `samples/` are ignored by Git. Provider clips should start in `samples/incoming/`, then move to `bad/`, `medium/`, `good/`, or `invalid/` after metadata review. `source` and `permission_status` are required for future dataset safety.

Run the dataset validation script with:

```bash
python backend/scripts/evaluate_samples.py
```

The validator checks required columns, allowed values, permissions, duration ranges, label/path consistency, missing files, and files missing metadata.

## Local Progression

CoachAI includes a local-only serious game foundation for MVP demos:

- XP awarded after completed analyses
- Player levels and level progress
- Daily quest: complete 1 single-shot analysis
- Weekly quest: complete 3 analyses this week
- Badges for first analysis, consistency, focus areas, and clean video quality
- Skill XP for shooting technique and recording/action clarity
- Local training path with recommended next focus

Progression is saved on this device in localStorage under `coachai.gamification`. It is not connected to authentication, a database, or cloud sync yet.

The Shooting Skill Tree is saved under `coachai.skillTree`. Its existing progression logic consumes the available technique scores from the analysis response. Previous sessions remain on the device and may contain scores generated before the real analysis was added.

The adaptive weekly training plan is saved under `coachai.weeklyTrainingPlan`. It uses the skill tree, latest result, and drill validity to suggest a weekly focus and four healthy training tasks. Task completion does not grant XP in this phase.

## Manual Demo Flow

Splash → Dashboard → Shooting Guide → Video Upload → Processing → Results → History → Profile

## Current Limitations

- Record one player taking one shot with the full body and ball visible around contact.
- Measurements are two-dimensional and sensitive to framing and perspective. Scoring thresholds require calibration against coach-reviewed clips.
- Target accuracy, ball speed and the exact point of impact on the foot are outside the current analysis.
- Local samples are for calibration only and are not committed
- XP, quests, streaks, and badges are local-only and can be cleared from browser storage
- Skill tree progress and training path recommendations are local-only for now
- Weekly training plans are local-only and are not synced to an account yet
- Uploaded videos are processed through temporary files and are not stored permanently
- Sampled frames and pose analysis are returned as metadata only; frame images and pose images are not saved permanently

## Next Steps

Expand the held-out set with independently recorded phone footage, natural left-foot strikes, and a wider variety of non-shooting actions. Compare the technique categories and recommended focus with independent coach reviews. The MVP scope remains single-shot analysis.
