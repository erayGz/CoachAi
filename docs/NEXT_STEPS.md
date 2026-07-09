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

- Local XP and player levels
- Daily and weekly quests
- Badges for healthy training milestones
- Progress summaries in Dashboard, Results, and Profile
- Dataset intake metadata validation
- Local incoming/provider sample workflow
- Shooting Skill Tree
- Local training path and next-step recommendations
- Authentication
- Cloud video storage
- Database
- User profile
- Coach panel
- Training plans

Phase 4-A adds the local-only serious game foundation first: XP, levels, quests, badges, streaks, and progress summaries stored in localStorage. It is intentionally lightweight and encourages short, quality-focused practice rather than repetitive uploads. Future Phase 4 work can move progression to a real user account once authentication and a database exist.

Phase 4-B adds the dataset intake and validation workflow. Next steps after this phase:

- Wait for dataset provider replies
- Confirm permission and usage scope
- Import sample clips into `samples/incoming/`
- Fill `samples/metadata.csv`
- Run validation
- Label usable clips into `bad`, `medium`, or `good`
- Move unusable clips into `invalid`
- Later: add a feedback system, personalized training recommendations, and export to model-ready format

Phase 4-C adds the local-only Shooting Skill Tree and Training Path foundation. It tracks skill XP for six technical shooting skills plus `Recording Clarity` and `Shot Action Clarity`, then shows skill progress in Results, Dashboard, and Profile. Future work should connect skill XP to real pose, ball, contact, and shooting metrics so recommendations become more personalized and accurate.

## Phase 5: Expansion

- Dribbling Lab
- First Touch Lab
- Passing Lab
- Football IQ
- Multi-shot Shooting Lab
- Other sports
