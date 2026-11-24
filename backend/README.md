# CoachAI Backend

The Football Shooting Lab estimates a single soccer strike and produces technique feedback from visible player and ball motion. FastAPI accepts the upload, OpenCV decodes the clip, and two pre-trained MediaPipe models run on the local CPU. CoachAI uses a versioned, deterministic scoring rubric for the output. Analysis requires no API key or paid service. The setup script downloads model files once and verifies their SHA-256 checksums.

## Setup

From the project root on Windows:

```powershell
python -m venv backend\.venv
.\backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.\backend\.venv\Scripts\python.exe backend\scripts\setup_pose_model.py
.\backend\.venv\Scripts\python.exe backend\scripts\check_pose_model.py
```

On macOS or Linux, use `python3 -m venv backend/.venv` and run the remaining commands with `backend/.venv/bin/python` and forward-slash paths. From the project root, `npm run dev` runs Vite and FastAPI. Use `npm.cmd run dev` in Windows PowerShell. For the backend alone, activate the virtual environment and run from `backend`:

```sh
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Open the API documentation at [localhost:8000/docs](http://127.0.0.1:8000/docs). `GET /health` reports the backend version.

## Analyze a shot

Record one player taking one shot. Keep the full player in frame and show the ball around the strike. Choose an angle that clearly shows both. The endpoint accepts a 1–15 second video as multipart field `file`, up to 100 MB.

```powershell
curl.exe -X POST http://127.0.0.1:8000/analyze/shooting -F "file=@shot.mp4;type=video/mp4"
```

The backend samples up to 30 frames per second and keeps separate ball candidates. When multiple balls are visible, it analyzes the last contact supported by foot movement and a change in the selected ball's trajectory. When the whole-frame pass is inconclusive, the backend can crop around a foot swing or back-project a short outgoing ball track to find the kicker in a wide view. A local retry can link a previously detected stationary ball to three consecutive or near-consecutive motion observations with a consistent direction, grounded by the visible kicking foot. A moving highlight alone cannot seed a ball track. Limited track estimates omit the follow-through score. The measurements in `shotMeasurements` are expressed in the image plane, and the same clip produces the same technique score on repeated runs.

| Field | Measurement |
| --- | --- |
| `contactTimeSeconds` | Estimated time of foot–ball contact near a change in the ball's trajectory |
| `kickingFoot` | Anatomical left or right foot closest to the ball in the contact window |
| `plantFootDistanceTorsoLengths` | Projected support-foot distance to the ball, divided by torso length |
| `torsoTiltDegrees` | Projected shoulder-to-hip tilt from image vertical at estimated contact |
| `followThroughTorsoLengths` | Projected kicking-ankle travel relative to the hips, along the detected ball direction, in the first 300 ms |

The existing result fields carry the overall score, available subscores and a drill for the lowest-scoring measured category. `scoringVersion` identifies the rubric. The first version averages available subscores and requires at least two. Temporary videos are deleted when processing ends. The response contains a compact sampling and pose summary alongside the technique measurements.

| HTTP status | Meaning |
| --- | --- |
| 200 | The clip provided evidence for one strike and enough visible technique to score |
| 400 / 413 | The upload could not be decoded, fell outside the duration range, or exceeded the file-size limit |
| 422 | The strike or technique could not be verified from the available footage |
| 503 | The local models or inference runtime are unavailable |

The existing frontend displays the backend's `detail` on upload failures.

## Verification and current limits

Run the deterministic tests from `backend` with the project Python environment:

```sh
python -m unittest discover -s tests -v
```

The tests cover contact timing on synthetic observations, missing measurements, multiple strikes and players, single-shot response compatibility, and upload cleanup. Run `python scripts/evaluate_samples.py` from `backend` to validate the local sample index.

The rubric uses provisional cutoffs for projected technique, so scores depend on the camera view. A partial 100 means the average of the available subscores rounded to 100. The feedback gives the number of metrics included. See [contact and coaching evaluation](../samples/README.md#shooting-contact-and-coaching-evaluation) for the labeled sets and coach review workflow. Accuracy at a target, true ball speed, exact contact point and reliable distinction between shots and firm passes require additional evidence or labeled data.

Model references are [MediaPipe Pose Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker?tab=Python) and [MediaPipe Object Detector](https://developers.google.com/edge/mediapipe/solutions/vision/object_detector?tab=Python).
