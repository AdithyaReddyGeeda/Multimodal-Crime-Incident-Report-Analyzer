# Multimodal Crime / Incident Report Analyzer

A Python project that analyzes incident-related images: object detection (YOLOv8), scene classification, OCR, and structured CSV output.

## Features

- **Image pipeline** (`modules/image_analyst.py`): scans `data/images/` for `.jpg`, `.jpeg`, and `.png` files.
- **Synthetic samples**: if the folder is empty, generates five 640×480 placeholder scenes (accident, fire, theft, crowd, vehicle).
- **Detection**: YOLOv8 nano (`yolov8n.pt`); class names and average confidence per image.
- **Scene type**: rule-based classification from detections and filename hints.
- **OCR**: Tesseract via `pytesseract` (requires [Tesseract](https://github.com/tesseract-ocr/tesseract) installed on your system for real text; otherwise results show `OCR unavailable`).
- **Output**: `outputs/image_output.csv` with incident ID, image ID, scene type, objects, extracted text, and confidence.

## Setup

```bash
cd "/path/to/Multimodal-Crime-Incident-Report-Analyzer"
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

On first run, Ultralytics downloads `yolov8n.pt` into the project directory (ignored by `.gitignore`).

## Run

```bash
python3 modules/image_analyst.py
```

The script prints a summary table and writes `outputs/image_output.csv`.

## Project layout

| Path | Purpose |
|------|---------|
| `modules/image_analyst.py` | Image analysis pipeline |
| `data/images/` | Input images |
| `outputs/` | Generated CSV and other outputs |
| `requirements.txt` | Python dependencies |

## Repository

[https://github.com/AdithyaReddyGeeda/Multimodal-Crime-Incident-Report-Analyzer](https://github.com/AdithyaReddyGeeda/Multimodal-Crime-Incident-Report-Analyzer)
