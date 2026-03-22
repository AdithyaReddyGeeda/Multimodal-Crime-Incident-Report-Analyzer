# Cursor Prompt — Module 3: Image Analyst

Paste this entire prompt into Cursor chat to build Module 3 of the Multimodal Crime/Incident Report Analyzer.

---

## TASK

Build a Python module called `image_analyst.py` inside a `modules/` folder. This module is part of a larger Multimodal Crime/Incident Report Analyzer system. It analyzes crime/accident scene images using object detection and OCR, then outputs a structured CSV.

---

## FOLDER STRUCTURE TO CREATE

```
multimodal_incident_analyzer/
├── data/
│   └── images/              ← input images go here
├── outputs/                 ← CSV output goes here
└── modules/
    └── image_analyst.py     ← the file you are building
```

Create all folders if they don't already exist using `pathlib.Path.mkdir(parents=True, exist_ok=True)`.

---

## FILE: `modules/image_analyst.py`

### What this module does

1. Looks for `.jpg`, `.jpeg`, or `.png` files inside `data/images/`.
2. If the folder is empty, it auto-generates 5 synthetic scene images using **Pillow** — do NOT skip this step.
3. Runs **YOLOv8** object detection on each image.
4. Classifies the scene type based on the detected objects.
5. Runs **pytesseract** OCR to extract any visible text from the image.
6. Outputs a structured CSV to `outputs/image_output.csv`.

---

### STEP 1 — Synthetic Image Generation (run only if `data/images/` is empty)

Use **Pillow** (`PIL`) to generate 5 synthetic images, each 640x480 pixels. Each image should simulate a different incident scene by drawing colored shapes, labels, and fake text on a plain background. Here are the 5 scenes to generate:

| Filename              | Background Color | Shapes to Draw                                              | Text to Draw on Image         |
|-----------------------|------------------|-------------------------------------------------------------|-------------------------------|
| `scene_accident.jpg`  | Light gray       | Two colored rectangles (simulating cars), one tilted        | "ROAD CLOSED", "XYZ 1234"     |
| `scene_fire.jpg`      | Dark gray        | Orange and red filled triangles (simulating flames)         | "DANGER", "FIRE ZONE"         |
| `scene_theft.jpg`     | White            | A person silhouette (rectangle), a bag shape (rectangle)   | "CCTV IN USE", "NO ENTRY"     |
| `scene_crowd.jpg`     | Light blue       | 6–8 small circles (simulating people)                      | "PUBLIC AREA", "Zone B"       |
| `scene_vehicle.jpg`   | Light green      | A large rectangle (truck), two circles (wheels)            | "TRUCK-99", "SPEED LIMIT 40"  |

Use `ImageDraw` and `ImageFont`. If a custom font is unavailable, fall back to `ImageFont.load_default()`. Save each image to `data/images/`.

---

### STEP 2 — Object Detection with YOLOv8

- Load the pretrained YOLOv8 nano model: `YOLO("yolov8n.pt")` from `ultralytics`.
- Run inference on each image: `results = model(image_path)`.
- Extract from results:
  - `detected_classes`: a comma-separated string of all detected class names (e.g., `"person, car, truck"`). If nothing is detected, use `"none"`.
  - `avg_confidence`: the mean confidence score across all detections, rounded to 2 decimal places. If nothing detected, use `0.0`.

---

### STEP 3 — Scene Type Classification

Write a function `classify_scene(detected_classes: str) -> str` that takes the comma-separated detected class string and returns one of these scene types based on simple keyword matching:

| Detected keywords              | Scene Type            |
|--------------------------------|-----------------------|
| "fire", "smoke"                | "Fire"                |
| "car", "truck", "bus", "bicycle", "motorcycle" | "Accident"  |
| "person" + "knife" or "gun"    | "Assault or Theft"    |
| Multiple "person" (3+)         | "Public Disturbance"  |
| "person" alone                 | "Suspicious Activity" |
| None of the above              | "Unknown"             |

Since the synthetic images won't produce real YOLO detections, for synthetic images also apply the scene classification based on the **filename** as a fallback:
- `scene_fire` → "Fire"
- `scene_accident` → "Accident"
- `scene_theft` → "Assault or Theft"
- `scene_crowd` → "Public Disturbance"
- `scene_vehicle` → "Accident"

---

### STEP 4 — OCR with pytesseract

- Run `pytesseract.image_to_string(Image.open(image_path))` on each image.
- Clean the result: strip whitespace, replace newlines with spaces, remove non-ASCII characters.
- If the result is empty or only whitespace, store `"none"`.

---

### STEP 5 — Build Output CSV

Assign `Incident_ID` values as `INC-001`, `INC-002`, etc. (one per image, in alphabetical order of filename).

Build a pandas DataFrame with these exact columns and save it to `outputs/image_output.csv`:

| Column            | Description                                             |
|-------------------|---------------------------------------------------------|
| `Incident_ID`     | e.g. INC-001                                            |
| `Image_ID`        | filename without extension, e.g. "scene_fire"          |
| `Scene_Type`      | output of classify_scene()                              |
| `Objects_Detected`| comma-separated YOLO class names, or "none"            |
| `Text_Extracted`  | cleaned pytesseract output, or "none"                  |
| `Confidence_Score`| average YOLO confidence, or 0.0                        |

After saving, print the full DataFrame to the console using `print(df.to_string(index=False))`.

---

### STEP 6 — Entry Points

The module must expose two entry points:

```python
def run_image_pipeline():
    """Main entry point called by main.py"""
    # full logic here

if __name__ == "__main__":
    run_image_pipeline()
```

---

## ERROR HANDLING RULES

- Wrap each image's processing in a `try/except` block. On failure, print a warning and skip that image — do not crash.
- If `pytesseract` is not installed or `tesseract` binary is not found, catch the exception and store `"OCR unavailable"` in `Text_Extracted`.
- If YOLOv8 model download fails (no internet), catch the exception, store `"detection unavailable"` in `Objects_Detected`, set `Confidence_Score` to `0.0`, and use filename-based scene classification.

---

## LIBRARIES TO USE

```
ultralytics       # YOLOv8
opencv-python     # image reading (cv2)
pytesseract       # OCR
Pillow            # synthetic image generation + OCR input
pandas            # CSV output
pathlib           # file paths (no hardcoded strings)
```

Install command:
```bash
pip install ultralytics opencv-python pytesseract Pillow pandas
```

> Note: `pytesseract` also requires the Tesseract binary. On Mac: `brew install tesseract`. On Ubuntu: `sudo apt install tesseract-ocr`.

---

## WHAT GOOD OUTPUT LOOKS LIKE

After running `python modules/image_analyst.py`, you should see:

```
[Image Analyst] No images found. Generating 5 synthetic scene images...
[Image Analyst] Saved: data/images/scene_accident.jpg
[Image Analyst] Saved: data/images/scene_fire.jpg
...
[Image Analyst] Processing scene_accident.jpg...
[Image Analyst] Processing scene_fire.jpg...
...
[Image Analyst] Done. Results saved to outputs/image_output.csv

 Incident_ID    Image_ID         Scene_Type  Objects_Detected  Text_Extracted  Confidence_Score
     INC-001  scene_accident       Accident              none    ROAD CLOSED XYZ 1234          0.0
     INC-002    scene_crowd  Public Disturbance          none    PUBLIC AREA Zone B             0.0
     INC-003    scene_fire            Fire              none    DANGER FIRE ZONE               0.0
     INC-004    scene_theft  Assault or Theft            none    CCTV IN USE NO ENTRY           0.0
     INC-005  scene_vehicle       Accident              none    TRUCK-99 SPEED LIMIT 40         0.0
```

---

## IMPORTANT NOTES

- Do NOT hardcode file paths — use `pathlib.Path` throughout.
- The `outputs/` folder must be created automatically if it doesn't exist.
- The module must be fully self-contained — importing it should not trigger any side effects; only calling `run_image_pipeline()` should.
- Do not use Jupyter notebooks — plain `.py` file only.
