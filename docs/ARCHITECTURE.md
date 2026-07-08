# Architecture

## Project Structure

### `src/app`

Main app shell, navigation state, selected video state, and current analysis session state.

### `src/screens`

Individual app screens for the MVP flow:

- Splash
- Dashboard
- Shooting Guide
- Video Upload
- Processing
- Results
- History
- Profile

### `src/components`

Reusable UI components such as score rings, stat cards, sub-score cards, training drill cards, video rule cards, headers, and bottom navigation.

### `src/data`

Mocked app metadata, profile data, analysis defaults, training drills, and other static frontend data.

### `src/types`

Shared TypeScript types for screens, navigation, video validation, analysis sessions, analysis results, history items, and UI data.

### `src/utils`

Utility logic for:

- API client
- Video validation
- Mock analysis generation
- localStorage history
- History stats helpers
- Session utilities
- Navigation helpers
- Theme constants

## App-Level Session State

The app stores the current selected video and current analysis session at the app level.

When the user taps `Analyze Video`, the app:

- Confirms there is a valid selected video
- Creates a unique analysis session id
- Stores the selected video metadata
- Sets the session status to `processing`
- Navigates to the Processing screen

When processing completes, the app:

- Sends the selected video to the FastAPI mock backend
- Stores the backend result in session state
- Marks the session as completed
- Saves the result to localStorage history once

This prevents duplicate saves if Processing remounts or the user navigates around the app.

## Video Validation

The upload flow accepts only video files.

The browser reads the video duration from the selected local file. The MVP allows single-shot videos from 3 to 15 seconds.

Validation states include:

- Not a video file
- Duration unavailable
- Too short
- Too long
- Valid

Only a valid video enables the `Analyze Video` button.

## Backend Mock API

The Phase 2 backend lives in `backend/` and exposes a FastAPI app.

For local integration, run it on port `8000`:

```bash
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The frontend uses `VITE_API_BASE_URL` to find the backend:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

If no environment variable is set, the frontend falls back to `http://127.0.0.1:8000`.

The Processing screen calls:

```text
POST /analyze/shooting
```

The selected video is sent as multipart form-data using the `file` field.

Backend endpoints:

- `GET /`
- `GET /health`
- `POST /analyze/shooting`

The analyze endpoint accepts only `video/*` uploads, rejects empty files, and enforces a 100 MB maximum file size. Backend validation errors use FastAPI's standard `{ "detail": "message" }` response shape.

Phase 3-A adds OpenCV video metadata extraction. The backend writes the uploaded video to a temporary file, extracts metadata, and deletes the temporary file after processing. No uploaded video is stored permanently.

Phase 3-B adds backend duration validation and metadata-aware quality checks. After metadata extraction, the backend enforces the same 3-15 second single-shot range as the frontend. It also evaluates resolution, FPS, duration, frame count, and sampled frames before returning the analysis response.

Phase 3-C adds sampled frame debug metadata. The backend selects up to 10 evenly spaced frames with OpenCV and returns lightweight metadata for each sampled frame. It does not save frame images, return base64 frame data, or create a frame output directory.

Phase 3-D adds a MediaPipe Tasks Pose Landmarker scaffold. The backend runs pose detection when MediaPipe and a local `.task` model are available, then returns lightweight detection quality metadata. It does not return full landmark coordinates, skeleton data, pose images, or frame images. If the model is missing or pose analysis fails, the endpoint still returns a mocked analysis with `poseAnalysis: null` and adds a warning to `videoQualityReport`.

Phase 3-E improves pose sampling and confidence. The public `sampledFrames` response remains limited to up to 10 lightweight frame metadata records, but pose analysis can internally use up to 20 candidate frames. Those pose candidates combine evenly spaced frames with simple high-motion frames selected by grayscale frame-difference scores. The backend deduplicates and sorts candidate frame indices before running pose detection.

Phase 3-F adds heuristic shooting drill validity checks. The backend estimates whether the uploaded clip looks like a valid single-shot football shooting drill before allowing confident mocked scoring. This does not use real ball detection or true shot detection yet. It uses duration, pose presence, full-body visibility, simple action cues from pose frames, and video quality to produce a `drillValidityReport`.

Phase 3-G makes unclear and invalid drill results safer. `Unclear` and `Invalid` responses are treated as limited previews, with stricter score caps, safer main focus labels, and softened feedback. Real ball detection is still required before CoachAI can make stronger shot-validity decisions.

Phase 3-H adds a local-only samples dataset and evaluation runner. Videos are organized under `samples/invalid`, `samples/bad`, `samples/medium`, and `samples/good`, while `samples/metadata.csv` records expected validity and confidence outcomes. Video files are ignored by Git. The evaluation runner posts each listed sample to the running backend and prints expected vs actual results so drill validity, confidence, and future scoring can be calibrated systematically.

Pose Landmarker expects the local model file at:

```text
backend/models/pose_landmarker_lite.task
```

Pose model files are local-only. `.task` files under `backend/models/` are ignored by git, while `backend/models/README.md` stays in the repo to document the expected file location. Developers can run `python scripts/check_pose_model.py` from the `backend` directory to verify whether the model is present. If the model is missing, the backend gracefully skips pose analysis, returns `poseAnalysis: null`, and adds a pose warning to `videoQualityReport`.

The response includes `videoMetadata`:

- `durationSeconds`
- `fps`
- `width`
- `height`
- `frameCount`
- `sampledFrameCount`

`sampledFrameCount` is calculated from the actual sampled frame metadata returned in `sampledFrames`, so the count matches `sampledFrames.length`.

The response also includes `videoQualityReport`:

- `quality`
- `reliability`
- `warnings`
- `checks`

`videoQuality` and `analysisReliability` are derived from the quality report. Warnings prevent reliability from being `High`, low resolution or low FPS lowers the quality label, and invalid drill validity sets reliability to `Medium`.

The response also includes `drillValidityReport`:

- `status`
- `confidence`
- `warnings`
- `checks`

Drill validity status can be `Valid`, `Unclear`, or `Invalid`. The backend still returns a mocked analysis for invalid or unclear clips, but it lowers confidence, caps score ranges, and uses more cautious feedback. `Unclear` scores are capped at 69, and `Invalid` scores are capped at 55. `detectedShots` is kept for API compatibility, but its visible product meaning is now `Shot Action` with values such as `Likely`, `Unclear`, and `Not verified`.

The response also includes `sampledFrames`:

- `frameIndex`
- `timestampSeconds`
- `width`
- `height`

This prepares the backend for future pose estimation and ball detection without storing uploaded videos or frame images permanently.

The response may also include `poseAnalysis`:

- `framesAnalyzed`
- `framesWithPose`
- `poseDetectionRate`
- `averageVisibility`
- `poseQuality`
- `frameSummaries`

For each analyzed pose candidate frame, `frameSummaries` stores only whether pose was detected, landmark count, and average visibility.

The response also includes `analysisConfidence`:

- `High` when pose quality is good and reliability is `High` or `Good`
- `Medium` when drill validity is unclear, pose quality is partial, or pose quality is good with medium reliability
- `Low` when drill validity is invalid, pose quality is poor, or pose analysis is unavailable

Poor pose detection sets `analysisReliability` to `Medium` and adds a limited-analysis warning. Partial pose detection prevents `analysisReliability` from being `High` and adds an approximate-feedback warning. Invalid or unclear drill validity also prevents overconfident scoring and feedback. Invalid reports use `Shot Action Clarity` as the main focus, while unclear reports use `Recording Clarity`. Real shooting technique scoring and real ball/contact detection remain future work.

The frontend API client reads backend `detail` messages when available. Processing shows those messages as:

```text
Analysis could not be completed. {backend detail}
```

If the backend is stopped or unreachable, Processing falls back to the backend-not-running message.

## Mock Analysis Generation

The backend currently extracts real video metadata, derives quality labels from it, and can measure pose detection quality, but still generates dynamic mocked shooting scores. The frontend mock generator remains available as a fallback utility for future offline/demo mode, but it is not used by default.

The generator:

- Uses weighted random score ranges
- Caps overall score at 55 for invalid drill clips
- Caps overall score at 69 for unclear drill clips
- Generates sub-scores around the overall score
- Clamps sub-scores to realistic limits
- Chooses the weakest sub-score as `Main Focus` only for valid drill clips
- Uses recording/action clarity as `Main Focus` for limited previews
- Generates coach feedback based on the weakest category
- Generates recommended training suggestions for the weakest category

This gives the demo realistic variation while metadata extraction prepares the backend for later real analysis.

## Local Sample Evaluation

The `samples/` folder is for local calibration only:

- `samples/invalid`
- `samples/bad`
- `samples/medium`
- `samples/good`
- `samples/metadata.csv`

The backend evaluation script lives at:

```text
backend/scripts/evaluate_samples.py
```

It reads `samples/metadata.csv`, locates local video files, sends them to the running backend, and compares expected validity and confidence with the actual `drillValidityReport` and `analysisConfidence`. It does not store videos, change backend behavior, or add a database. This workflow is intended to calibrate heuristic drill validity now and real scoring later.

## localStorage History

Analysis history is saved on the user's device using localStorage.

Saved history is used by:

- Dashboard stats and recent sessions
- History stats, filters, chart, and list
- Profile stats

Each history item includes the session id, date/time, module name, drill name, overall score, level, shot action, video quality, analysis reliability, and main focus.

If present, saved history also preserves `analysisConfidence`, `drillValidityReport`, `videoMetadata`, `videoQualityReport`, `sampledFrames`, and `poseAnalysis` for future screens or backend integration work.

Duplicate history items are prevented by checking the saved item id before writing to localStorage.

## Guarded Screens

Processing requires a valid selected video and active analysis session. If the user reaches Processing without a valid session, the screen shows a friendly recovery state.

Results requires a completed analysis result. If the user reaches Results without one, the screen shows a friendly empty state with a button back to Upload.
