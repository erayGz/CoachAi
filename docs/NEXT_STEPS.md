# Next Steps

## Phase 2: Backend Mock API

- Add FastAPI backend
- Add `/health` endpoint
- Add `/analyze` mock endpoint
- Frontend calls backend instead of local mock generator

## Phase 3: Real Video Analysis

- Add OpenCV metadata extraction
- Add backend duration validation and video quality checks
- Make reliability metadata-aware
- Add sampled frame metadata for debugging
- Add pose detection scaffold
- Add pose estimation
- Add ball detection
- Extract shooting metrics
- Generate real scoring data

Phase 3-A now covers basic OpenCV metadata extraction. Phase 3-B adds metadata-based duration validation, quality checks, and reliability labels. Phase 3-C adds evenly spaced sampled frame metadata without saving frame images permanently. Phase 3-D adds a pose detection scaffold for detection quality only. Scoring is still mocked. Later Phase 3 work should replace mocked scoring with real frame, pose, ball, and shooting metric analysis.

## Phase 4: Product Features

- Authentication
- Cloud video storage
- Database
- User profile
- Coach panel
- Training plans

## Phase 5: Expansion

- Dribbling Lab
- First Touch Lab
- Passing Lab
- Football IQ
- Other sports
