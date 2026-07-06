# Backend Models

This folder is for local machine learning model files used by the CoachAI backend.

Pose analysis uses MediaPipe Tasks Pose Landmarker and expects this local model file:

```text
backend/models/pose_landmarker_lite.task
```

Large `.task` model files should stay local and should not be committed to the repository. The backend will still run without the model file, but `poseAnalysis` will be returned as `null` and the response will include a pose analysis warning.
