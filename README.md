# Multimodal Crime / Incident Report Analyzer

Python pipelines and a React dashboard for analyzing incident-related **images** (fire detection, OCR) and **audio transcripts** (NER, events, sentiment). Outputs are CSV files you can merge or feed into the dashboard.

**Repository:** [Multimodal-Crime-Incident-Report-Analyzer](https://github.com/AdithyaReddyGeeda/Multimodal-Crime-Incident-Report-Analyzer)

---

## Features

### Module 3 — Image analysis (`modules/image_analyst.py`)

- **Input:** Up to **15** images from `fire-detection.v1i.yolov8/test/images/`, sorted alphabetically (Roboflow YOLOv8 export at the project root).
- **Inference:** [Roboflow](https://roboflow.com) **hosted** fire/smoke model (`confidence=40`, `overlap=30`). If the API is unavailable, falls back to local **Ultralytics** `yolov8n.pt` (COCO classes — not fire-specific).
- **Scene classification:** Rule-based mapping from class names (e.g. fire, smoke, light, no-fire) to scene types.
- **OCR:** [Tesseract](https://github.com/tesseract-ocr/tesseract) via `pytesseract`. Without the Tesseract binary, text shows as `OCR unavailable`.
- **Output:** `outputs/image_output.csv` — `Incident_ID`, `Image_ID`, `Scene_Type`, `Objects_Detected`, `Text_Extracted`, `Confidence_Score`.

### Module 1 — Audio transcripts (`modules/audio_analyst.py`)

- **Input:** `data/audio/transcripts.csv` with `call_id` and `transcript` (e.g. from [this Kaggle notebook](https://www.kaggle.com/code/stpeteishii/911-calls-wav2vec2)).
- **Processing:** spaCy NER (`en_core_web_sm`), keyword event labels, DistilBERT sentiment + urgency (with keyword fallback).
- **Output:** `outputs/audio_output.csv` — first **10** rows processed.

### Dashboard (`dashboard/`)

- React + Vite + Tailwind; charts and tables for **image** results (`dashboard/src/data/imageResults.js`).
- **Sync CSV → dashboard:** after regenerating the image CSV, run `sync_dashboard_data.py` so the UI matches `outputs/image_output.csv` without manual copy-paste.

---

## Prerequisites

- **Python 3.9+**
- **Tesseract** (for OCR): macOS `brew install tesseract`, Ubuntu `sudo apt install tesseract-ocr`
- **Node.js** (for the dashboard): current LTS recommended
- **Roboflow API key** (for hosted image inference) — store in `.env`, not in code
- **spaCy English model** (audio): `python -m spacy download en_core_web_sm`

---

## Configuration

1. Clone the repo and enter the project directory.

2. Create a virtual environment (recommended):

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate   # Windows: .venv\Scripts\activate
   ```

3. Install Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. **Environment variables:** copy the example file and add your Roboflow key:

   ```bash
   cp .env.example .env
   ```

   Edit **`.env`** in the project root (same folder as `modules/`):

   ```env
   ROBOFLOW_API_KEY=your_key_here
   ```

   The file **`.env` is gitignored** — do not commit secrets. `modules/image_analyst.py` and `modules/audio_analyst.py` load it via `python-dotenv`.

5. First run of the image pipeline may download **`yolov8n.pt`** into the project (used as fallback; listed in `.gitignore`).

---

## How to run

### Image pipeline

```bash
python3 modules/image_analyst.py
```

Writes **`outputs/image_output.csv`** and prints a summary table.

### Sync dashboard with image CSV

```bash
python3 sync_dashboard_data.py
```

### View dashboard

```bash
cd dashboard
npm install    # first time only
npm run dev
```

### Audio pipeline

Place **`data/audio/transcripts.csv`**, then:

```bash
python3 modules/audio_analyst.py
```

---

## Suggested workflow (images + UI)

```bash
python3 modules/image_analyst.py
python3 sync_dashboard_data.py
cd dashboard && npm run dev
```

---

## Project layout

| Path | Purpose |
|------|---------|
| `modules/image_analyst.py` | Image inference, classification, OCR → CSV |
| `modules/audio_analyst.py` | Transcript NER, events, sentiment → CSV |
| `sync_dashboard_data.py` | Copies `outputs/image_output.csv` → `dashboard/src/data/imageResults.js` |
| `fire-detection.v1i.yolov8/` | Roboflow fire dataset (e.g. `test/images/`) |
| `data/audio/transcripts.csv` | Input for audio module (you provide from Kaggle/export) |
| `outputs/` | `image_output.csv`, `audio_output.csv` |
| `dashboard/` | React frontend |
| `.env` / `.env.example` | Local secrets (not committed) vs template |
| `requirements.txt` | Python dependencies |

---

## License / data

Dataset and API usage are subject to **Roboflow**, **Kaggle**, and your own account terms. Do not commit API keys or large private datasets unless intended.
