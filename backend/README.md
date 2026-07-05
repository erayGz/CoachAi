# CoachAI Backend

FastAPI mock backend for the CoachAI Football · Shooting Lab MVP.

This backend is intentionally limited to Phase 2:

- No real AI analysis
- No authentication
- No database
- No cloud video storage
- No permanent video saving

The `/analyze/shooting` endpoint accepts a local video file and returns a dynamic mocked shooting analysis result that matches the current frontend analysis shape.

## Setup

From the project root:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

## Run The Backend

From the `backend` directory:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at:

```text
http://127.0.0.1:8000
```

Interactive API docs:

```text
http://127.0.0.1:8000/docs
```

## Endpoints

### `GET /health`

Returns backend health status.

Example:

```bash
curl http://127.0.0.1:8000/health
```

Response:

```json
{
  "status": "ok",
  "service": "coachai-backend"
}
```

### `POST /analyze/shooting`

Accepts a shooting drill video as `multipart/form-data`.

The backend reads basic uploaded file metadata:

- `filename`
- `contentType`
- `fileSizeBytes`

It does not save the file permanently and does not run real AI analysis yet.

Example:

```bash
curl -X POST http://127.0.0.1:8000/analyze/shooting \
  -F "file=@sample-shooting-video.mp4"
```

Windows PowerShell example:

```powershell
curl.exe -X POST http://127.0.0.1:8000/analyze/shooting `
  -F "file=@sample-shooting-video.mp4"
```

Example response shape:

```json
{
  "id": "a25f2f79-5e2a-4e13-b1aa-9ed093c0d6b2",
  "createdAt": "2026-07-05T12:00:00Z",
  "moduleName": "Football · Shooting Lab",
  "drillName": "Shooting Analysis",
  "overallScore": 76,
  "level": "Intermediate",
  "detectedShots": "5/5",
  "videoQuality": "Good",
  "analysisReliability": "Good",
  "mainFocus": "Plant Foot Position",
  "mainFocusDescription": "Your support foot is slightly too far from the ball in most shots...",
  "technicalBreakdown": [
    {
      "label": "Plant Foot Position",
      "score": 64,
      "color": "#FFB020",
      "delta": "-12",
      "status": "Needs Work"
    }
  ],
  "aiCoachFeedback": "Your follow-through is strong and your body balance is improving...",
  "recommendedTraining": [
    {
      "name": "Plant foot placement drill",
      "reps": "4 x 8 shots",
      "focus": "Position"
    }
  ],
  "uploadedFile": {
    "filename": "sample-shooting-video.mp4",
    "contentType": "video/mp4",
    "fileSizeBytes": 1234567
  }
}
```

## Manual Verification Commands

Install dependencies:

```bash
pip install -r backend/requirements.txt
```

Run backend from project root:

```bash
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Test health:

```bash
curl http://127.0.0.1:8000/health
```

Test analysis with a sample video:

```bash
curl -X POST http://127.0.0.1:8000/analyze/shooting \
  -F "file=@sample-shooting-video.mp4"
```

## CORS

CORS is enabled for local frontend development:

- `http://127.0.0.1:5173`
- `http://localhost:5173`
