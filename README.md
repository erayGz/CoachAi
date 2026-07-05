# CoachAI

## MVP Module

Football · Shooting Lab

## Description

CoachAI is a mobile-first AI sports coaching MVP. The first module analyzes a short football shooting drill video and returns a technical score, feedback, and training recommendations.

## Current Status

Frontend-only MVP with dynamic mocked analysis.

## Main Features

- Mobile-first / PWA-style layout
- Shooting video upload
- Video file validation
- 10-25 second duration validation
- Processing flow
- Dynamic weighted mock analysis results
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

## Manual Demo Flow

Splash → Dashboard → Shooting Guide → Video Upload → Processing → Results → History → Profile

## Current Limitations

- No backend yet
- No real AI analysis yet
- No authentication yet
- Video is not uploaded to a server yet
- Results are dynamically mocked for MVP testing

## Next Planned Phase

The next planned phase is a FastAPI backend with a mock `/analyze` endpoint, followed by real video analysis.
