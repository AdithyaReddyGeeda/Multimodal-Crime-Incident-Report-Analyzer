"""
Multimodal Crime/Incident Report Analyzer — image pipeline.
Self-contained; no side effects on import.

Place images in data/images/, or set ROBOFLOW_API_KEY and configure
download_roboflow_dataset() to fetch from Roboflow when the folder is empty.
"""

# SETUP REQUIRED: Install Tesseract binary before running OCR
# Mac:   brew install tesseract
# Ubuntu: sudo apt install tesseract-ocr
# Windows: https://github.com/UB-Mannheim/tesseract/wiki

from __future__ import annotations

import os
import re
import shutil
import sys
import warnings
from pathlib import Path

import cv2
import pandas as pd
import pytesseract

_MODULE_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _MODULE_DIR.parent
_DATA_IMAGES = _PROJECT_ROOT / "data" / "images"
_ROBOFLOW_ROOT = _PROJECT_ROOT / "data" / "roboflow_dataset"
_OUTPUTS = _PROJECT_ROOT / "outputs"

_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
_ROBOFLOW_COPY_LIMIT = 10

_NO_IMAGES_MSG = (
    "[Image Analyst] ❌ No images found in data/images/. \n"
    "Please download the Roboflow fire detection dataset and place images there.\n"
    "See: universe.roboflow.com — search \"fire detection\", download in YOLOv8 format."
)

_ROBOFLOW_NOT_CONFIGURED_MSG = """[Image Analyst] ❌ Roboflow not configured.
Steps to fix:
  1. pip install roboflow
  2. Go to universe.roboflow.com → search "fire detection"
  3. Pick a dataset with 1000+ images → Download → YOLOv8 format
  4. Set your API key: export ROBOFLOW_API_KEY="your_key_here"
  5. Update workspace and project name in download_roboflow_dataset()"""


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


def _find_split_images_dir(download_root: Path) -> Path | None:
    for split in ("test", "valid"):
        for p in download_root.rglob("images"):
            if (
                p.is_dir()
                and p.parent.name.lower() == split
                and p.name.lower() == "images"
            ):
                return p
    return None


def _roboflow_not_configured_exit() -> None:
    print(_ROBOFLOW_NOT_CONFIGURED_MSG)
    sys.exit(1)


def download_roboflow_dataset() -> int:
    """
    Download YOLOv8 dataset from Roboflow and copy the first _ROBOFLOW_COPY_LIMIT
    images into data/images/. Exits the process if roboflow is missing or misconfigured.
    """
    try:
        from roboflow import Roboflow
    except ImportError:
        _roboflow_not_configured_exit()

    api_key = os.environ.get("ROBOFLOW_API_KEY", "").strip()
    if not api_key:
        _roboflow_not_configured_exit()

    loc = str(_ROBOFLOW_ROOT.resolve())
    _ROBOFLOW_ROOT.mkdir(parents=True, exist_ok=True)

    try:
        rf = Roboflow(api_key=api_key)
        project = rf.workspace("YOUR_WORKSPACE").project("YOUR_PROJECT")
        version = project.version(1)
        version.download("yolov8", location=loc)
    except Exception as e:
        print(_ROBOFLOW_NOT_CONFIGURED_MSG)
        print(f"[Image Analyst] Detail: {e}")
        sys.exit(1)

    split_dir = _find_split_images_dir(_ROBOFLOW_ROOT)
    if split_dir is None:
        print(_ROBOFLOW_NOT_CONFIGURED_MSG)
        print(
            "[Image Analyst] Detail: could not find test/images or valid/images "
            "under the downloaded dataset.",
        )
        sys.exit(1)

    sources: list[Path] = []
    for p in sorted(split_dir.iterdir()):
        if p.is_file() and p.suffix.lower() in _IMAGE_EXTENSIONS:
            sources.append(p)
    sources = sources[:_ROBOFLOW_COPY_LIMIT]

    if not sources:
        print(_ROBOFLOW_NOT_CONFIGURED_MSG)
        print("[Image Analyst] Detail: no .jpg/.jpeg/.png files in split folder.")
        sys.exit(1)

    n = 0
    used_names: set[str] = set()
    for src in sources:
        dest_name = src.name
        if dest_name in used_names:
            dest_name = f"{src.stem}_{n}{src.suffix}"
        used_names.add(dest_name)
        shutil.copy2(src, _DATA_IMAGES / dest_name)
        n += 1

    rel = _DATA_IMAGES.relative_to(_PROJECT_ROOT)
    print(f"[Image Analyst] Copied {n} images from Roboflow into {rel}/")
    return n


def classify_scene(detected_classes: str | list[str]) -> str:
    """Classify incident scene from YOLO class names (no filename-based inference)."""
    if isinstance(detected_classes, str):
        s = detected_classes.strip().lower()
        if s in ("none", "detection unavailable", ""):
            classes_lower: list[str] = []
        else:
            classes_lower = [c.strip().lower() for c in detected_classes.split(",") if c.strip()]
    else:
        classes_lower = [c.strip().lower() for c in detected_classes if c and str(c).strip()]

    if not classes_lower:
        return "Unknown"

    fire_set = {"fire", "smoke", "flame"}
    if any(c in fire_set for c in classes_lower):
        return "Fire"

    vehicle_set = {"car", "truck", "bus", "bicycle", "motorcycle"}
    person_count = sum(1 for c in classes_lower if c == "person")

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

    return "Unknown"


def _run_yolo_on_image(
    model: object | None, path: Path
) -> tuple[str, float, bool]:
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
        try:
            raw = pytesseract.image_to_string(img)
        except Exception as e:
            err = str(e).strip().replace("\n", " ")
            print(f"[Image Analyst] OCR error: {err}")
            return f"OCR unavailable: {err}"
        text = " ".join(raw.split())
        text = re.sub(r"[^\x00-\x7F]+", "", text)
        text = text.strip()
        return text if text else "none"
    except Exception as e:
        err = str(e).strip().replace("\n", " ")
        print(f"[Image Analyst] OCR step failed: {err}")
        return f"OCR unavailable: {err}"


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
            row["Scene_Type"] = classify_scene("detection unavailable")
        else:
            objs, conf, ok = _run_yolo_on_image(model, path)
            row["Objects_Detected"] = objs
            row["Confidence_Score"] = conf
            if not ok or objs == "detection unavailable":
                row["Objects_Detected"] = "detection unavailable"
                row["Confidence_Score"] = 0.0
                row["Scene_Type"] = classify_scene("detection unavailable")
            else:
                row["Scene_Type"] = classify_scene(objs)

        row["Text_Extracted"] = _ocr_image(path)
    except Exception as e:
        warnings.warn(f"Skipping {path}: {e}", stacklevel=2)
        row["Scene_Type"] = "Unknown"
        row["Objects_Detected"] = "detection unavailable"
        row["Confidence_Score"] = 0.0
    return row


def run_image_pipeline() -> None:
    _ensure_directories()
    image_paths = _list_image_files()
    if not image_paths:
        download_roboflow_dataset()
        image_paths = _list_image_files()

    if not image_paths:
        print(_NO_IMAGES_MSG)
        raise RuntimeError("No images found in data/images/")

    model = None
    yolo_failed_globally = False
    try:
        from ultralytics import YOLO

        model = YOLO("yolov8n.pt")
    except Exception as e:
        warnings.warn(f"YOLOv8 unavailable ({e}); scene type will be Unknown.", stacklevel=2)
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
    print(df.to_string(index=False))


if __name__ == "__main__":
    run_image_pipeline()
