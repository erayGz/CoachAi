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

The browser reads the video duration from the selected local file. The MVP allows videos from 10 to 25 seconds.

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

The response includes `videoMetadata`:

- `durationSeconds`
- `fps`
- `width`
- `height`
- `frameCount`
- `sampledFrameCount`

The frontend API client reads backend `detail` messages when available. Processing shows those messages as:

```text
Analysis could not be completed. {backend detail}
```

If the backend is stopped or unreachable, Processing falls back to the backend-not-running message.

## Mock Analysis Generation

The backend currently extracts real video metadata but still generates dynamic mocked shooting scores. The frontend mock generator remains available as a fallback utility for future offline/demo mode, but it is not used by default.

The generator:

- Uses weighted random score ranges
- Generates sub-scores around the overall score
- Clamps sub-scores to realistic limits
- Chooses the weakest sub-score as `Main Focus`
- Generates coach feedback based on the weakest category
- Generates recommended training suggestions for the weakest category

This gives the demo realistic variation while metadata extraction prepares the backend for later real analysis.

## localStorage History

Analysis history is saved on the user's device using localStorage.

Saved history is used by:

- Dashboard stats and recent sessions
- History stats, filters, chart, and list
- Profile stats

Each history item includes the session id, date/time, module name, drill name, overall score, level, detected shots, video quality, analysis reliability, and main focus.

Duplicate history items are prevented by checking the saved item id before writing to localStorage.

## Guarded Screens

Processing requires a valid selected video and active analysis session. If the user reaches Processing without a valid session, the screen shows a friendly recovery state.

Results requires a completed analysis result. If the user reaches Results without one, the screen shows a friendly empty state with a button back to Upload.
