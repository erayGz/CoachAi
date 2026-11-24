# Local model weights

From `backend`, run `python scripts/setup_pose_model.py` to install the Pose Landmarker Lite and EfficientDet-Lite0 files into this folder. Run `python scripts/check_pose_model.py` to verify them. The setup script pins the public Google model URLs and verifies the downloads.

The runtime uses `pose_landmarker_lite.task` for body landmarks and `efficientdet_lite0.tflite` for the `sports ball` category. Both files are ignored by Git.
