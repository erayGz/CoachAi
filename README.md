# CoachAI

## MVP Module

Football · Shooting Lab

## Description

CoachAI is a mobile-first AI sports coaching MVP. The first module analyzes a short single-shot football shooting video and returns a technical score, feedback, and training recommendations.

## Current Status

Frontend MVP connected to a FastAPI mock backend. The backend extracts basic video metadata with OpenCV, samples lightweight frame metadata, runs an optional MediaPipe Tasks pose detection scaffold for detection quality, validates video duration, evaluates metadata-based video quality, estimates shooting drill validity with lightweight heuristics, derives pose-aware confidence, and returns dynamic mocked analysis results for local integration testing.

## Main Features

- Mobile-first / PWA-style layout
- Shooting video upload
- Video file validation
- 3-15 second duration validation
- Processing flow
- Dynamic weighted mock analysis results
- FastAPI mock analysis API
- OpenCV video metadata extraction
- Lightweight sampled frame metadata
- Motion-aware pose candidate sampling
- Pose detection scaffold
- Heuristic shooting drill validity checks
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

## Tech Stack

- React
- Vite
- TypeScript
- CSS
- localStorage
- FastAPI
- OpenCV

## How To Run

```bash
npm install
npm run dev
npm run build
```

The local development server runs at:

```text
http://127.0.0.1:5173/
```

The frontend reads the backend URL from:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

If the variable is not set, the frontend falls back to `http://127.0.0.1:8000`.

For local full-stack testing, run the backend on port `8000`:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend endpoints:

- `GET /`
- `GET /health`
- `POST /analyze/shooting`

The analyze endpoint accepts `video/*` uploads up to 100 MB. It temporarily writes the uploaded video, extracts OpenCV metadata, returns up to 10 lightweight sampled frame metadata records, and can use up to 20 internal pose candidate frames chosen from a mix of evenly spaced and high-motion frames. When `backend/models/pose_landmarker_lite.task` exists, the backend runs optional MediaPipe Tasks Pose Landmarker detection, validates that duration is 3-15 seconds, estimates whether the clip matches the single-shot shooting drill requirements, deletes the temporary file, and returns mocked scoring plus `videoMetadata`, `videoQualityReport`, `drillValidityReport`, `sampledFrames`, optional `poseAnalysis`, and `analysisConfidence`. Backend errors return a `detail` message, and the frontend shows that message in the Processing error state when available.

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

Progression is saved on this device in localStorage under `coachai.gamification`. It is not connected to authentication, a database, or cloud sync yet.

## Manual Demo Flow

Splash → Dashboard → Shooting Guide → Video Upload → Processing → Results → History → Profile

## Current Limitations

- No real AI analysis yet
- No authentication yet
- Video is not uploaded to a server yet
- Results scoring is dynamically mocked by the backend for MVP testing
- Video quality and reliability are influenced by real metadata
- Pose analysis is used only for detection quality and confidence, not real scoring
- Drill validity is heuristic and does not use real ball detection yet
- Invalid or unclear clips lower confidence, cap scores, and avoid overconfident feedback
- Low or partial pose detection produces more cautious feedback
- Local samples are for calibration only and are not committed
- XP, quests, streaks, and badges are local-only and can be cleared from browser storage
- Uploaded videos are processed through temporary files and are not stored permanently
- Sampled frames and pose analysis are returned as metadata only; frame images and pose images are not saved permanently

## Next Planned Phase

The next planned phase is replacing the mock scoring in `/analyze/shooting` with real video analysis.
