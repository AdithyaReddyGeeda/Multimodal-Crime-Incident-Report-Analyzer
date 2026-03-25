# Multimodal Crime / Incident Report Analyzer

Python pipelines and a React dashboard for analyzing incident-related **images** (fire detection, OCR), **911 call transcripts** (NER, event types, sentiment, urgency), **CCTV videos** (motion + YOLO events), and **news/social text** (NER, sentiment, topic). Outputs are CSV files you can merge or feed into the dashboard.

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

- **Input:** `data/audio/transcripts.csv` with columns `call_id`, `transcript`. The pipeline reads the **first 10** rows (or all if fewer). Incident IDs are assigned sequentially as **`INC-001` … `INC-010`** so they align with the image module for later merging.
- **Optional — generate transcripts:** If you have `.mp3` / `.wav` files under `data/audio/`, run **`python transcribe_audio.py`** (OpenAI Whisper `base`) to build `transcripts.csv`. You can also supply transcripts from another source (e.g. [Kaggle 911 examples](https://www.kaggle.com/code/stpeteishii/911-calls-wav2vec2)).
- **Processing:** spaCy NER (`en_core_web_sm`) for **GPE** / **LOC** plus regex fallbacks for streets and exits; keyword-based **event type** (Fire, Road Accident, Assault, Theft, Public Disturbance, Suspicious Activity, or Unknown); Hugging Face **DistilBERT** sentiment (`distilbert-base-uncased-finetuned-sst-2-english`) with an **urgency score** (0–1) and keyword boosts; fallback urgency if the model fails to load.
- **Output:** `outputs/audio_output.csv` — `Incident_ID`, `Call_ID`, `Transcript`, `Extracted_Event`, `Location`, `Sentiment`, `Urgency_Score`.

### Module 4 — Video analysis (`modules/video_analyst.py`)

- **Input:** CCTV clips from `data/videos/` (CAVIAR dataset; start with `.mpg` clips).
- **Processing:** OpenCV frame extraction (default every 10 frames), motion detection via frame differencing (thresholded pixel-change ratio), and YOLOv8 (`yolov8n.pt`) only on motion-flagged frames.
- **Event classification:** Rule-based mapping to `Person Movement`, `Vehicle Movement`, `Crowd Gathering`, `Anomaly Detected`, or `No Event`.
- **Output:** `outputs/video_output.csv` — `Incident_ID`, `Timestamp`, `Frame_ID`, `Event_Detected`, `Objects`, `Confidence`.

### Module 5 — Text / news (`modules/text_analyst.py`)

- **Input:** `data/text/crimereport.csv`, `crimereport.txt`, `CrimeReport.csv`, or **`CrimeReport.txt`** from the [Kaggle CrimeReport dataset](https://www.kaggle.com/datasets/cameliasiadat/crimereport). The default export is **JSON Lines** (one tweet JSON per line), not a comma-separated table; the pipeline loads that format automatically. The pipeline reads the **first 10** rows.
- **Preprocess:** Auto-detect text column (`text`, `description`, `content`, or `report`); clean URLs/special characters; NLTK tokenization + English stopword removal.
- **NER:** spaCy `en_core_web_sm` — people, locations, organizations, dates; stored as one **`Entities`** string (`People: …; Locations: …; Organizations: …; Dates: …`).
- **Sentiment:** Hugging Face DistilBERT SST-2 (`distilbert-base-uncased-finetuned-sst-2-english`).
- **Topic:** Zero-shot `facebook/bart-large-mnli` with labels `accident`, `fire`, `theft`, `public disturbance`, `assault`, `other`; keyword fallback if the model is unavailable.
- **Output:** `outputs/text_output.csv` — includes `Sentiment_Score` (model confidence, 0–1) for dashboard use in addition to `Sentiment`, `Entities`, and `Topic`.

### Dashboard (`dashboard/`)

- React + Vite + Tailwind unified incident dashboard for **audio**, **image**, **video**, and **text** results:
  - `dashboard/src/data/imageResults.js`
  - `dashboard/src/data/audioResults.js`
  - `dashboard/src/data/videoResults.js`
  - `dashboard/src/data/textResults.js`
- **Sync CSV → dashboard:** after regenerating outputs, run **`python sync_dashboard_data.py`** so all module outputs are reflected in the UI (no manual copy-paste).

---

## Prerequisites

- **Python 3.9+**
- **Tesseract** (for OCR): macOS `brew install tesseract`, Ubuntu `sudo apt install tesseract-ocr`
- **Node.js** (for the dashboard): current LTS recommended
- **Roboflow API key** (for hosted image inference) — store in `.env`, not in code
- **spaCy English model** (audio / text): after installing deps, run `python -m spacy download en_core_web_sm`
- **NLTK data** (text): first run may download `stopwords`, `punkt`, and `punkt_tab` automatically, or run:  
  `python -m nltk.downloader stopwords punkt punkt_tab`

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
   python -m spacy download en_core_web_sm
   ```

4. **Environment variables:** copy the example file and add your Roboflow key:

   ```bash
   cp .env.example .env
   ```

   Edit **`.env`** in the project root (same folder as `modules/`):

   ```env
   ROBOFLOW_API_KEY=your_key_here
   ```

   The file **`.env` is gitignored** — do not commit secrets. `modules/image_analyst.py` (and `modules/audio_analyst.py`) load it via `python-dotenv` when present.

5. First run of the image pipeline may download **`yolov8n.pt`** into the project (used as fallback; listed in `.gitignore`).

---

## How to run

### Image pipeline

```bash
python3 modules/image_analyst.py
```

Writes **`outputs/image_output.csv`** and prints a summary table.

### Audio pipeline

1. Ensure **`data/audio/transcripts.csv`** exists (from **`python transcribe_audio.py`** or your own export).
2. Run:

   ```bash
   python3 modules/audio_analyst.py
   ```

Writes **`outputs/audio_output.csv`** and prints the full DataFrame.

### Video pipeline

1. Ensure CCTV clips exist in **`data/videos/`** (for example, from CAVIAR).
2. Run:

   ```bash
   python3 modules/video_analyst.py
   ```

Writes **`outputs/video_output.csv`** with one row per detected incident event.

### Text pipeline

1. Download [CrimeReport](https://www.kaggle.com/datasets/cameliasiadat/crimereport) and save as **`data/text/crimereport.csv`** or **`data/text/crimereport.txt`** (either name works).
2. Run:

   ```bash
   python3 modules/text_analyst.py
   ```

Writes **`outputs/text_output.csv`** and prints the full DataFrame.

### Sync dashboard with CSV outputs

```bash
python3 sync_dashboard_data.py
```

Updates **`dashboard/src/data/imageResults.js`**, **`dashboard/src/data/audioResults.js`**, **`dashboard/src/data/videoResults.js`**, and **`dashboard/src/data/textResults.js`** from the CSVs (prints a message if a CSV is missing).

### View dashboard

```bash
cd dashboard
npm install    # first time only
npm run dev
```

---

## Suggested workflows

**Images only:**

```bash
python3 modules/image_analyst.py
python3 sync_dashboard_data.py
cd dashboard && npm run dev
```

**Audio (Whisper → analyst → UI):**

```bash
python3 transcribe_audio.py
python3 modules/audio_analyst.py
python3 sync_dashboard_data.py
cd dashboard && npm run dev
```

**Video (analyst → UI):**

```bash
python3 modules/video_analyst.py
python3 sync_dashboard_data.py
cd dashboard && npm run dev
```

**Full stack (image + audio + video + text):**

```bash
python3 modules/image_analyst.py
python3 transcribe_audio.py
python3 modules/audio_analyst.py
python3 modules/video_analyst.py
python3 modules/text_analyst.py
python3 sync_dashboard_data.py
cd dashboard && npm run dev
```

---

## Project layout

| Path | Purpose |
|------|---------|
| `modules/image_analyst.py` | Image inference, classification, OCR → CSV |
| `modules/audio_analyst.py` | Transcript NER, events, sentiment, urgency → CSV |
| `modules/video_analyst.py` | Motion + YOLO CCTV event detection → CSV |
| `modules/text_analyst.py` | CrimeReport CSV: NER, sentiment, topic → CSV |
| `transcribe_audio.py` | Whisper: `data/audio/*.mp3|wav` → `data/audio/transcripts.csv` |
| `sync_dashboard_data.py` | Syncs image/audio/video/text CSV outputs → `dashboard/src/data/*.js` |
| `fire-detection.v1i.yolov8/` | Roboflow fire dataset (e.g. `test/images/`) |
| `data/audio/` | Audio files and `transcripts.csv` input for Module 1 |
| `data/videos/` | CCTV clips input for Module 4 |
| `data/text/` | `crimereport.csv` or `crimereport.txt` input for Module 5 |
| `outputs/` | `image_output.csv`, `audio_output.csv`, `video_output.csv`, `text_output.csv` |
| `dashboard/` | React frontend (`imageResults.js`, `audioResults.js`, `videoResults.js`, `textResults.js`) |
| `.env` / `.env.example` | Local secrets (not committed) vs template |
| `requirements.txt` | Python dependencies |

---

## License / data

Dataset and API usage are subject to **Roboflow**, **Kaggle**, **Hugging Face**, and your own account terms. Do not commit API keys or large private datasets unless intended.
