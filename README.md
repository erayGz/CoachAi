# CoachAI

## MVP Module

Football · Shooting Lab

## Description

CoachAI is a mobile-first AI sports coaching MVP. The first module analyzes a short football shooting drill video and returns a technical score, feedback, and training recommendations.

## Current Status

Frontend MVP connected to a FastAPI mock backend. The backend extracts basic video metadata with OpenCV, validates video duration, evaluates metadata-based video quality, and returns dynamic mocked analysis results for local integration testing.

## Main Features

- Mobile-first / PWA-style layout
- Shooting video upload
- Video file validation
- 10-25 second duration validation
- Processing flow
- Dynamic weighted mock analysis results
- FastAPI mock analysis API
- OpenCV video metadata extraction
- Backend duration validation
- Metadata-aware video quality and reliability
- Results screen
- Local history tracking
- Profile stats from saved analyses
- History filters

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

The analyze endpoint accepts `video/*` uploads up to 100 MB. It temporarily writes the uploaded video, extracts OpenCV metadata, validates that duration is 10-25 seconds, deletes the temporary file, and returns mocked scoring plus `videoMetadata` and `videoQualityReport`. Backend errors return a `detail` message, and the frontend shows that message in the Processing error state when available.

## Manual Demo Flow

Splash → Dashboard → Shooting Guide → Video Upload → Processing → Results → History → Profile

## Current Limitations

- No real AI analysis yet
- No authentication yet
- Video is not uploaded to a server yet
- Results scoring is dynamically mocked by the backend for MVP testing
- Video quality and reliability are influenced by real metadata
- Uploaded videos are processed through temporary files and are not stored permanently

## Next Planned Phase

The next planned phase is replacing the mock scoring in `/analyze/shooting` with real video analysis.
