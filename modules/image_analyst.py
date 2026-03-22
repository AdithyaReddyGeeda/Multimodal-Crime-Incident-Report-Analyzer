"""
Multimodal Crime/Incident Report Analyzer — image pipeline.
Self-contained; no side effects on import.
"""

from __future__ import annotations

import re
import warnings
from pathlib import Path

import cv2
import pandas as pd
import pytesseract
from PIL import Image, ImageDraw

# Paths relative to project root (parent of modules/)
_MODULE_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _MODULE_DIR.parent
_DATA_IMAGES = _PROJECT_ROOT / "data" / "images"
_OUTPUTS = _PROJECT_ROOT / "outputs"

_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}

_SYNTHETIC_SPECS = (
    {
        "filename": "scene_accident.jpg",
        "bg": (128, 128, 128),
        "draw": lambda d, w, h: (
            d.rectangle([80, 200, 220, 320], fill=(60, 60, 80)),
            d.rectangle([400, 210, 540, 330], fill=(70, 70, 90)),
            d.text((100, 100), "ROAD CLOSED", fill=(255, 255, 255)),
            d.text((400, 100), "XYZ 1234", fill=(255, 255, 255)),
        ),
    },
    {
        "filename": "scene_fire.jpg",
        "bg": (20, 20, 30),
        "draw": lambda d, w, h: (
            d.polygon([(w // 2 - 80, 380), (w // 2, 200), (w // 2 + 80, 380)], fill=(200, 80, 0)),
            d.polygon([(w // 2 - 40, 380), (w // 2 + 20, 250), (w // 2 + 100, 380)], fill=(255, 120, 20)),
            d.text((200, 80), "DANGER", fill=(255, 100, 0)),
            d.text((180, 120), "FIRE ZONE", fill=(255, 150, 50)),
        ),
    },
    {
        "filename": "scene_theft.jpg",
        "bg": (255, 255, 255),
        "draw": lambda d, w, h: (
            d.rectangle([200, 180, 260, 340], fill=(100, 120, 150)),
            d.rectangle([280, 240, 340, 300], fill=(80, 60, 40)),
            d.text((150, 80), "CCTV IN USE", fill=(0, 0, 0)),
            d.text((350, 80), "NO ENTRY", fill=(200, 0, 0)),
        ),
    },
    {
        "filename": "scene_crowd.jpg",
        "bg": (173, 216, 230),
        "draw": lambda d, w, h: (
            [
                d.ellipse([100 + i * 70, 200, 140 + i * 70, 240], fill=(50, 50, 80))
                for i in range(7)
            ],
            d.text((200, 100), "PUBLIC AREA", fill=(0, 0, 100)),
            d.text((380, 100), "Zone B", fill=(0, 0, 100)),
        ),
    },
    {
        "filename": "scene_vehicle.jpg",
        "bg": (144, 238, 144),
        "draw": lambda d, w, h: (
            d.rectangle([180, 220, 460, 320], fill=(90, 90, 110)),
            d.ellipse([200, 300, 260, 360], fill=(40, 40, 40)),
            d.ellipse([380, 300, 440, 360], fill=(40, 40, 40)),
            d.text((220, 120), "TRUCK-99", fill=(0, 80, 0)),
            d.text((150, 160), "SPEED LIMIT 40", fill=(0, 0, 0)),
        ),
    },
)


def _ensure_directories() -> None:
    _DATA_IMAGES.mkdir(parents=True, exist_ok=True)
    _OUTPUTS.mkdir(parents=True, exist_ok=True)


def _list_image_files() -> list[Path]:
    if not _DATA_IMAGES.is_dir():
        return []
    out: list[Path] = []
    for p in sorted(_DATA_IMAGES.iterdir()):
        if p.is_file() and p.suffix.lower() in _IMAGE_EXTENSIONS:
            out.append(p)
    return out


def _generate_synthetic_images() -> None:
    w, h = 640, 480
    for spec in _SYNTHETIC_SPECS:
        path = _DATA_IMAGES / spec["filename"]
        img = Image.new("RGB", (w, h), spec["bg"])
        draw = ImageDraw.Draw(img)
        spec["draw"](draw, w, h)
        img.save(path, format="JPEG", quality=90)


def _ensure_sample_images() -> None:
    if _list_image_files():
        return
    try:
        _generate_synthetic_images()
    except Exception as e:
        warnings.warn(f"Synthetic image generation failed: {e}", stacklevel=2)


def classify_scene(detected_classes: str | list[str], filename: str) -> str:
    """Classify incident scene from YOLO class names and optional filename fallback."""
    if isinstance(detected_classes, str):
        if detected_classes.strip().lower() in ("none", "detection unavailable", ""):
            classes_lower: list[str] = []
        else:
            classes_lower = [c.strip().lower() for c in detected_classes.split(",") if c.strip()]
    else:
        classes_lower = [c.strip().lower() for c in detected_classes if c and str(c).strip()]

    person_count = sum(1 for c in classes_lower if c == "person")

    if any(x in classes_lower for x in ("fire", "smoke")):
        return "Fire"
    vehicle_set = {"car", "truck", "bus", "bicycle", "motorcycle"}
    if any(c in vehicle_set for c in classes_lower):
        return "Accident"
    has_knife = "knife" in classes_lower
    has_gun = "gun" in classes_lower
    if person_count >= 1 and (has_knife or has_gun):
        return "Assault or Theft"
    if person_count >= 3:
        return "Public Disturbance"
    if person_count == 1:
        return "Suspicious Activity"

    stem = Path(filename).stem.lower()
    if "scene_fire" in stem:
        return "Fire"
    if "scene_accident" in stem or "scene_vehicle" in stem:
        return "Accident"
    if "scene_theft" in stem:
        return "Assault or Theft"
    if "scene_crowd" in stem:
        return "Public Disturbance"

    return "Unknown"


def _scene_from_filename_only(filename: str) -> str:
    return classify_scene("none", filename)


def _run_yolo_on_image(
    model: object | None, path: Path
) -> tuple[str, float, bool]:
    """
    Returns (comma-separated classes, avg confidence, success).
    On total failure, caller should use detection unavailable.
    """
    if model is None:
        return "detection unavailable", 0.0, False
    try:
        results = model(str(path), verbose=False)
        names: list[str] = []
        confs: list[float] = []
        for r in results:
            boxes = getattr(r, "boxes", None)
            if boxes is None or len(boxes) == 0:
                continue
            rnames = getattr(r, "names", {})
            for i in range(len(boxes)):
                cls_id = int(boxes.cls[i].item())
                label = rnames.get(cls_id, str(cls_id))
                names.append(str(label))
                confs.append(float(boxes.conf[i].item()))
        if not names:
            return "none", 0.0, True
        avg_conf = round(sum(confs) / len(confs), 2)
        return ",".join(names), avg_conf, True
    except Exception:
        return "detection unavailable", 0.0, False


def _ocr_image(path: Path) -> str:
    try:
        img = cv2.imread(str(path))
        if img is None:
            return "none"
        text = pytesseract.image_to_string(img)
        text = " ".join(text.split())
        text = re.sub(r"[^\x00-\x7F]+", "", text)
        text = text.strip()
        return text if text else "none"
    except Exception:
        return "OCR unavailable"


def _process_one_image(
    path: Path,
    model: object | None,
    yolo_failed_globally: bool,
    index: int,
) -> dict[str, object]:
    row: dict[str, object] = {
        "Incident_ID": f"INC-{index:03d}",
        "Image_ID": path.stem,
        "Scene_Type": "Unknown",
        "Objects_Detected": "none",
        "Text_Extracted": "none",
        "Confidence_Score": 0.0,
    }
    try:
        if yolo_failed_globally or model is None:
            row["Objects_Detected"] = "detection unavailable"
            row["Confidence_Score"] = 0.0
            row["Scene_Type"] = _scene_from_filename_only(path.name)
        else:
            objs, conf, ok = _run_yolo_on_image(model, path)
            row["Objects_Detected"] = objs
            row["Confidence_Score"] = conf
            if not ok or objs == "detection unavailable":
                row["Objects_Detected"] = "detection unavailable"
                row["Confidence_Score"] = 0.0
                row["Scene_Type"] = _scene_from_filename_only(path.name)
            else:
                row["Scene_Type"] = classify_scene(objs, path.name)

        row["Text_Extracted"] = _ocr_image(path)
    except Exception as e:
        warnings.warn(f"Skipping {path}: {e}", stacklevel=2)
        row["Scene_Type"] = _scene_from_filename_only(path.name)
        row["Objects_Detected"] = "detection unavailable"
        row["Confidence_Score"] = 0.0
    return row


def run_image_pipeline() -> None:
    _ensure_directories()
    _ensure_sample_images()

    image_paths = _list_image_files()
    model = None
    yolo_failed_globally = False
    try:
        from ultralytics import YOLO

        model = YOLO("yolov8n.pt")
    except Exception as e:
        warnings.warn(f"YOLOv8 unavailable ({e}); using filename fallback for scene type.", stacklevel=2)
        yolo_failed_globally = True

    rows: list[dict[str, object]] = []
    for i, path in enumerate(image_paths, start=1):
        try:
            rows.append(_process_one_image(path, model, yolo_failed_globally, i))
        except Exception as e:
            warnings.warn(f"Skipping {path}: {e}", stacklevel=2)

    df = pd.DataFrame(rows)
    if not df.empty:
        df = df[
            [
                "Incident_ID",
                "Image_ID",
                "Scene_Type",
                "Objects_Detected",
                "Text_Extracted",
                "Confidence_Score",
            ]
        ]

    out_csv = _OUTPUTS / "image_output.csv"
    df.to_csv(out_csv, index=False)
    print(df.to_string())


if __name__ == "__main__":
    run_image_pipeline()
