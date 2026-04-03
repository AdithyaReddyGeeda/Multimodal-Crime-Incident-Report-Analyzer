# Multimodal Crime / Incident Report Analyzer

An AI system that reads **audio calls**, **PDF documents**, **images**, **CCTV videos**, and **crime text reports** — and merges everything into one unified incident dashboard.

Built for the AI for Engineers group assignment.

**GitHub:** [AdithyaReddyGeeda/Multimodal-Crime-Incident-Report-Analyzer](https://github.com/AdithyaReddyGeeda/Multimodal-Crime-Incident-Report-Analyzer)

---

## What it does

| Module | Data | AI Used | Output |
|--------|------|---------|--------|
| Audio Analyst | 5 emergency call recordings | Whisper (speech-to-text), spaCy NER, HuggingFace sentiment | `audio_output.csv` — 5 rows |
| Document Analyst | Arkansas PD PDF (75 pages, FOIA) | pdfplumber, OCR, spaCy NER | `document_output.csv` — 4 rows |
| Image Analyst | 154 fire/smoke photos | Roboflow YOLOv8 (85.4% mAP), OCR | `image_output.csv` — 154 rows |
| Video Analyst | 12 CCTV clips (CAVIAR dataset) | OpenCV, YOLOv8, motion detection | `video_output.csv` — 230 rows |
| Text Analyst | 127 crime reports | spaCy NER, DistilBERT, BART zero-shot | `text_output.csv` — 127 rows |
| **Integrator** | All 5 CSVs | pandas merge + severity scoring | `final_integrated_report.csv` — **515 rows** |

The React dashboard lets you search, filter by source/severity, and view full incident details.

---

## Before you clone

You need:

- **Python 3.9 or higher** — [python.org](https://www.python.org/downloads/)
- **Node.js LTS** — [nodejs.org](https://nodejs.org/)
- **Tesseract OCR** — for reading text in images
  - Mac: `brew install tesseract`
  - Windows: [download installer](https://github.com/tesseract-ocr/tesseract/wiki)
- **FFmpeg** — for audio processing
  - Mac: `brew install ffmpeg`
  - Windows: [download here](https://ffmpeg.org/download.html)

---

## Step 1 — Clone the repo

```bash
git clone https://github.com/AdithyaReddyGeeda/Multimodal-Crime-Incident-Report-Analyzer.git
cd "Multimodal-Crime-Incident-Report-Analyzer"
```

---

## Step 2 — Set up Python

```bash
python3 -m venv .venv
source .venv/bin/activate
```

> Windows: `.venv\Scripts\activate`

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python -m nltk.downloader stopwords punkt punkt_tab
```

---

## Step 3 — Set up the dashboard

```bash
cd dashboard
npm install
cd ..
```

---

## Step 4 — Add your API key

The image module uses Roboflow for fire detection. Create a `.env` file in the project root:

```
ROBOFLOW_API_KEY=your_key_here
```

> Get a free key at [roboflow.com](https://roboflow.com). Without it, the image module falls back to a local YOLOv8 model — results will still work but accuracy may be lower.

---

## Step 5 — Download the datasets

Large files are not stored in the repo. You need to download them manually:

### 5a. PDF (Document module)
1. Go to [MuckRock — Arkansas Police 1033 Training Proposals](https://www.muckrock.com/foi/arkansas-114/arkansas-police-departments-1033-training-plan-proposals-20493/)
2. Download the PDF (the training proposal document, not the FOIA request letters)
3. Save it to: `data/documents/` (any filename is fine, e.g. `LESO2.pdf`)

### 5b. Fire detection images (Image module)
1. Go to [Roboflow Fire Detection Dataset](https://universe.roboflow.com/leilamegdiche/fire-detection-rsqrr/1)
2. Download in YOLOv8 format
3. Extract to the project root so you have: `fire-detection.v1i.yolov8/test/images/`

### 5c. CCTV videos (Video module)
1. Go to [CAVIAR Dataset](https://homepages.inf.ed.ac.uk/rbf/CAVIARDATA1/)
2. Download at least 3–5 `.mpg` clips
3. Save them to: `data/videos/`

### 5d. Audio and text
Already included in the repo:
- `data/audio/` — 5 MP3 files + `transcripts.csv`
- `data/Text/CrimeReport.txt` — 127 crime reports

---

## Step 6 — Run the full pipeline

Make sure you are in the project root folder (the one with `main.py`).

```bash
python3 main.py
```

This runs all 5 modules in order and merges the results. It may take a few minutes the first time (models download automatically).

Or run each module individually:

```bash
python3 modules/audio_analyst.py
python3 modules/document_analyst.py
python3 modules/image_analyst.py
python3 modules/video_analyst.py
python3 modules/text_analyst.py
python3 modules/integrator.py
```

---

## Step 7 — Open the dashboard

```bash
python3 sync_dashboard_data.py
cd dashboard
npm run dev
```

Open the link shown in your terminal — usually `http://localhost:5173`.

---

## Project structure

```
├── main.py                        ← Runs the full pipeline
├── sync_dashboard_data.py         ← Syncs CSV results to dashboard
├── requirements.txt
├── .env                           ← Your API keys (do NOT commit this)
│
├── modules/
│   ├── audio_analyst.py
│   ├── document_analyst.py
│   ├── image_analyst.py
│   ├── video_analyst.py
│   ├── text_analyst.py
│   └── integrator.py
│
├── data/
│   ├── audio/                     ← MP3 files + transcripts.csv
│   ├── documents/                 ← PDF/DOCX files (download manually)
│   ├── videos/                    ← CAVIAR .mpg files (download manually)
│   └── Text/CrimeReport.txt
│
├── outputs/                       ← Generated CSVs (created when you run)
│   ├── audio_output.csv
│   ├── document_output.csv
│   ├── image_output.csv
│   ├── video_output.csv
│   ├── text_output.csv
│   └── final_integrated_report.csv
│
├── dashboard/                     ← React app (npm run dev)
│
├── pipeline_architecture.html     ← Visual pipeline diagram (open in browser)
└── project_report.docx            ← Full project report
```

---

## Common problems

**`No module named 'X'`** — Run `pip install -r requirements.txt` again with your virtual environment active.

**`No such file or directory: modules/...`** — You are in the wrong folder. Run `cd` to get back to the project root (the folder with `main.py`).

**Images module fails** — Check that your `ROBOFLOW_API_KEY` is set in `.env` and the images are in `fire-detection.v1i.yolov8/test/images/`.

**Video module fails** — Make sure `.mpg` files are in `data/videos/` and FFmpeg is installed.

**Document module produces 0 rows** — Check that there is at least one `.pdf`, `.docx`, or `.txt` file in `data/documents/`.

**Dashboard shows no data** — Run `python3 sync_dashboard_data.py` first, then `npm run dev`.

---

## Deliverables

| File | What it is |
|------|-----------|
| `project_report.docx` | Full written report covering all modules, tools, datasets, challenges |
| `pipeline_architecture.html` | Visual diagram of the AI pipeline (open in any browser) |
| `outputs/final_integrated_report.csv` | The merged dataset of 515 incidents |
| `dashboard/` | Interactive React dashboard |
