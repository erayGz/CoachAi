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

- Generates one analysis result for that session
- Stores that exact result in session state
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

## Mock Analysis Generation

The MVP generates dynamic mocked shooting analysis results on the frontend.

The generator:

- Uses weighted random score ranges
- Generates sub-scores around the overall score
- Clamps sub-scores to realistic limits
- Chooses the weakest sub-score as `Main Focus`
- Generates coach feedback based on the weakest category
- Generates recommended training suggestions for the weakest category

This gives the demo realistic variation without adding real AI analysis yet.

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
