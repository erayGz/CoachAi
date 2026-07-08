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
- Add motion-aware pose candidate sampling
- Add pose-aware analysis confidence
- Add heuristic shooting drill validity checks
- Soften unclear and invalid limited-preview reports
- Add local samples dataset and evaluation runner
- Add pose estimation
- Add ball detection
- Add real shot/contact detection
- Extract shooting metrics
- Generate real scoring data

Phase 3-A now covers basic OpenCV metadata extraction. Phase 3-B adds metadata-based duration validation, quality checks, and reliability labels. Phase 3-C adds lightweight sampled frame metadata without saving frame images permanently. Phase 3-D supports the MediaPipe Tasks Pose Landmarker scaffold with a local `.task` model for detection quality only. Phase 3-E adds motion-aware internal pose candidate sampling, pose-aware reliability adjustments, `analysisConfidence`, and more honest limited-analysis feedback. Phase 3-F adds heuristic shooting drill validity so random non-shooting clips do not receive overconfident results. Phase 3-G makes unclear and invalid results safer by treating them as limited previews with stricter score caps and softened feedback. Phase 3-H adds a local-only samples dataset and evaluation runner for calibrating validity, confidence, and future scoring. Scoring is still mocked. Later Phase 3 work should replace mocked scoring with real frame, pose, ball, contact, and shooting metric analysis.

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
- Multi-shot Shooting Lab
- Other sports
