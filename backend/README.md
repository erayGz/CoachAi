# CoachAI Backend

FastAPI mock backend for the CoachAI Football · Shooting Lab MVP.

This backend is intentionally limited to Phase 3-A:

- No real AI analysis
- No authentication
- No database
- No cloud video storage
- No permanent video saving

The `/analyze/shooting` endpoint accepts a local video file, extracts basic video metadata with OpenCV, and returns a dynamic mocked shooting analysis result that matches the current frontend analysis shape. Scoring is still mocked.

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

The backend uses `opencv-python` for basic video metadata extraction.

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

### `GET /`

Returns a simple service status message.

```bash
curl http://127.0.0.1:8000/
```

Response:

```json
{
  "service": "coachai-backend",
  "message": "CoachAI backend is running",
  "docs": "/docs"
}
```

### `GET /health`

Returns backend health status and version.

```bash
curl http://127.0.0.1:8000/health
```

Response:

```json
{
  "status": "ok",
  "service": "coachai-backend",
  "version": "0.1.0"
}
```

### `POST /analyze/shooting`

Accepts a shooting drill video as `multipart/form-data`.

Validation:

- Accepted file type: `video/*`
- Maximum file size: 100 MB
- Empty files are rejected

The backend reads basic uploaded file metadata:

- `filename`
- `contentType`
- `fileSizeBytes`

It also extracts video metadata with OpenCV:

- `durationSeconds`
- `fps`
- `width`
- `height`
- `frameCount`
- `sampledFrameCount`

The uploaded file is written to a temporary file for OpenCV processing and deleted after extraction. No uploaded video is stored permanently.

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
  },
  "videoMetadata": {
    "durationSeconds": 14.2,
    "fps": 30.0,
    "width": 1920,
    "height": 1080,
    "frameCount": 426,
    "sampledFrameCount": 10
  }
}
```

## Common Error Responses

Errors use FastAPI's standard shape:

```json
{
  "detail": "error message"
}
```

Examples:

```json
{
  "detail": "Only video files are supported."
}
```

```json
{
  "detail": "Uploaded video is empty."
}
```

```json
{
  "detail": "Video file is too large. Maximum size is 100 MB."
}
```

```json
{
  "detail": "Uploaded file could not be read as a valid video."
}
```

```json
{
  "detail": "Video metadata extraction failed."
}
```

The frontend reads `detail` when available and shows it in the Processing error state.

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

Test root:

```bash
curl http://127.0.0.1:8000/
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

Expected: the response includes `videoMetadata`.

Test non-video validation:

```bash
curl -X POST http://127.0.0.1:8000/analyze/shooting \
  -F "file=@README.md;type=text/plain"
```

## CORS

CORS is enabled for local frontend development:

- `http://127.0.0.1:5173`
- `http://localhost:5173`
