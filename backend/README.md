# CoachAI Backend

FastAPI mock backend for the CoachAI Football · Shooting Lab MVP.

This backend is intentionally limited to Phase 3-D:

- No real AI analysis
- No authentication
- No database
- No cloud video storage
- No permanent video saving

The `/analyze/shooting` endpoint accepts a local video file, extracts basic video metadata with OpenCV, samples lightweight frame metadata, runs an optional MediaPipe pose detection scaffold, validates duration, evaluates metadata-based video quality, and returns a dynamic mocked shooting analysis result that matches the current frontend analysis shape. Scoring is still mocked.

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

The backend uses `opencv-python` for basic video metadata extraction and `mediapipe` for the optional pose detection scaffold. If MediaPipe is unavailable in the local Python environment, `/analyze/shooting` still returns a mocked analysis and adds a pose-analysis warning.

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
- Duration must be 10-25 seconds

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

It also extracts up to 10 evenly spaced sampled frame metadata records:

- `frameIndex`
- `timestampSeconds`
- `width`
- `height`

Sampled frames are not saved to disk, returned as base64, or stored permanently. Only metadata is returned for future computer vision debugging.

If MediaPipe is available, the backend runs pose detection on the sampled frame indices and returns lightweight `poseAnalysis` metadata:

- `framesAnalyzed`
- `framesWithPose`
- `poseDetectionRate`
- `averageVisibility`
- `poseQuality`
- `frameSummaries`

The pose scaffold does not return full landmark coordinates, skeletons, base64 images, or saved pose images. It is used only to understand detection quality for future shooting analysis.

The backend evaluates video quality from metadata:

- Resolution
- FPS
- Duration
- Frame count
- Frame sampling

The response includes a compact `videoQualityReport` with `quality`, `reliability`, `warnings`, and per-check status rows. `videoQuality` and `analysisReliability` are derived from this report instead of being fully random. If only 4 of 5 shots are detected in the mock result, reliability is capped below `High`. Poor or unavailable pose detection also adds a warning and caps `High` reliability.

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
  },
  "videoQualityReport": {
    "quality": "Excellent",
    "reliability": "High",
    "warnings": [],
    "checks": [
      {
        "label": "Resolution",
        "status": "pass",
        "message": "HD resolution or better."
      }
    ]
  },
  "sampledFrames": [
    {
      "frameIndex": 0,
      "timestampSeconds": 0.0,
      "width": 1920,
      "height": 1080
    }
  ],
  "poseAnalysis": {
    "framesAnalyzed": 10,
    "framesWithPose": 8,
    "poseDetectionRate": 0.8,
    "averageVisibility": 0.72,
    "poseQuality": "Good",
    "frameSummaries": [
      {
        "frameIndex": 0,
        "timestampSeconds": 0.0,
        "poseDetected": true,
        "landmarkCount": 33,
        "visibilityAverage": 0.74
      }
    ]
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

```json
{
  "detail": "Video is too short. Please upload a 10-25 second shooting drill video."
}
```

```json
{
  "detail": "Video is too long. Please upload a 10-25 second shooting drill video."
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

Expected: the response includes `videoMetadata`, `videoQualityReport`, and `sampledFrames`. `videoMetadata.sampledFrameCount` should equal `sampledFrames.length`. If MediaPipe runs successfully, the response also includes `poseAnalysis`; if pose analysis fails, the response still succeeds and includes a pose warning in `videoQualityReport.warnings`.

Test non-video validation:

```bash
curl -X POST http://127.0.0.1:8000/analyze/shooting \
  -F "file=@README.md;type=text/plain"
```

## CORS

CORS is enabled for local frontend development:

- `http://127.0.0.1:5173`
- `http://localhost:5173`
