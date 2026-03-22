# Cursor Prompt — Multimodal Crime/Incident Report Analyzer

---

## PROJECT OVERVIEW

Build a complete **Multimodal Crime/Incident Report Analyzer** in Python. The system ingests 5 types of unstructured data (audio, PDF documents, images, video, and text), processes each through a dedicated AI pipeline, and merges all outputs into a single unified incident dataset with a severity score and an interactive dashboard.

The project is structured into **5 independent modules** (one per data type) plus a **final integration module**. Each module outputs a structured CSV. All CSVs are merged on a shared `Incident_ID` key.

Use a clean folder structure, modular Python code (one file per module), and a shared `requirements.txt`. All modules should be runnable independently via `python module_name.py`, and the full pipeline should be runnable via `python main.py`.

---

## FOLDER STRUCTURE

```
multimodal_incident_analyzer/
│
├── main.py                  # Runs full pipeline end-to-end
├── requirements.txt
├── README.md
│
├── data/
│   ├── audio/               # .wav or .mp3 files
│   ├── documents/           # PDF police reports
│   ├── images/              # Scene photographs
│   ├── videos/              # CCTV .mp4 or .mpg clips
│   └── text/                # Social media / news CSVs
│
├── outputs/
│   ├── audio_output.csv
│   ├── document_output.csv
│   ├── image_output.csv
│   ├── video_output.csv
│   ├── text_output.csv
│   └── final_integrated_report.csv
│
├── modules/
│   ├── audio_analyst.py
│   ├── document_analyst.py
│   ├── image_analyst.py
│   ├── video_analyst.py
│   ├── text_analyst.py
│   └── integrator.py
│
└── dashboard/
    └── app.py               # Streamlit dashboard
```

---

## MODULE 1 — Audio Analyst (`modules/audio_analyst.py`)

### Purpose
Process emergency audio call recordings and extract structured incident information from speech.

### Input
- Directory: `data/audio/`
- File types: `.wav`, `.mp3`
- If no real audio files exist, **generate 5 synthetic audio samples** using `gTTS` (Google Text-to-Speech) with realistic 911-style call scripts (e.g., "There's a fire at 45 Oak Street, people are trapped, please hurry!"). Save them to `data/audio/` before processing.

### Tasks
1. Transcribe each audio file to text using **OpenAI Whisper** (`openai-whisper`).
2. Extract named entities from the transcript: incident type, location, person names, urgency phrases — using **spaCy** (`en_core_web_sm` model).
3. Perform sentiment + urgency analysis on the transcript using a **HuggingFace transformers** pipeline (e.g., `distilbert-base-uncased-finetuned-sst-2-english`). Map sentiment score to an `Urgency_Score` between 0.0 and 1.0.
4. Assign a sequential `Incident_ID` starting from `INC-001`.

### Output CSV — `outputs/audio_output.csv`
Columns: `Incident_ID`, `Call_ID`, `Transcript`, `Extracted_Event`, `Location`, `Sentiment`, `Urgency_Score`

### Libraries
```
openai-whisper
spacy
transformers
torch
gTTS
```

---

## MODULE 2 — Document Analyst (`modules/document_analyst.py`)

### Purpose
Extract structured information from PDF police reports and official incident filings.

### Input
- Directory: `data/documents/`
- File types: `.pdf`
- If no real PDFs exist, **programmatically generate 5 realistic synthetic police report PDFs** using `reportlab`. Each PDF should include: a report ID, incident type (e.g., "Theft", "Assault", "Fire"), date, location (street address), officer name, suspect description, and a short summary paragraph.

### Tasks
1. For **text-based PDFs**: extract raw text using **pdfplumber**.
2. For **scanned/image PDFs**: convert pages to images and run **pytesseract** OCR.
3. Auto-detect which type each PDF is (check if pdfplumber returns empty text → fall back to OCR).
4. Run **spaCy NER** on the extracted text to identify: dates (`DATE`), locations (`GPE`/`LOC`), person names (`PERSON`), and organizations (`ORG`).
5. Use regex patterns to extract structured fields: incident type, officer name, report date.
6. Assign matching `Incident_ID` values (e.g., `INC-001` through `INC-005`).

### Output CSV — `outputs/document_output.csv`
Columns: `Incident_ID`, `Report_ID`, `Incident_Type`, `Date`, `Location`, `Officer`, `Summary`

### Libraries
```
pdfplumber
pymupdf
pytesseract
Pillow
reportlab
spacy
```

---

## MODULE 3 — Image Analyst (`modules/image_analyst.py`)

### Purpose
Analyze crime/accident scene images using object detection and OCR to extract visual evidence.

### Input
- Directory: `data/images/`
- File types: `.jpg`, `.jpeg`, `.png`
- If no real images exist, **download 5 diverse Creative Commons scene images** using the `requests` library from stable public URLs (e.g., Wikimedia Commons images of car accidents, fires, street scenes). Alternatively, generate placeholder images using `Pillow` with drawn shapes and text labels simulating scenes.

### Tasks
1. Run **YOLOv8** (`ultralytics`) object detection on each image using the pretrained `yolov8n.pt` model. Extract: detected class names, bounding box count, and average confidence score.
2. Classify the **scene type** (accident / fire / theft / disturbance) by mapping detected YOLO classes to scene categories:
   - fire/smoke → "Fire"
   - car/truck/bicycle + road → "Accident"
   - person + knife/gun → "Theft or Assault"
   - crowd of people → "Public Disturbance"
   - Default → "Unknown"
3. Run **pytesseract** OCR on the image to extract any visible text (license plates, street signs, banners).
4. Assign `Incident_ID` values sequentially.

### Output CSV — `outputs/image_output.csv`
Columns: `Incident_ID`, `Image_ID`, `Scene_Type`, `Objects_Detected`, `Text_Extracted`, `Confidence_Score`

### Libraries
```
ultralytics
opencv-python
pytesseract
Pillow
requests
```

---

## MODULE 4 — Video Analyst (`modules/video_analyst.py`)

### Purpose
Process CCTV/surveillance video clips, extract key frames, detect motion and objects, and produce a timestamped event log.

### Input
- Directory: `data/videos/`
- File types: `.mp4`, `.mpg`, `.avi`
- If no real video files exist, **generate 3 synthetic test videos** using `OpenCV` (`cv2.VideoWriter`). Each video should be ~5 seconds at 10 fps. Simulate motion by drawing a moving rectangle (representing a person or vehicle) on a plain background, with a different color and speed for each clip.

### Tasks
1. Extract frames from each video at a configurable interval (default: every 1 second / every N frames).
2. Apply **frame differencing motion detection** using OpenCV: compare consecutive frames, threshold the diff, and flag frames with motion above a pixel-change threshold.
3. Run **YOLOv8** on each flagged (motion-detected) frame to detect and classify objects.
4. Classify the event in each frame based on detected objects:
   - "Vehicle Movement", "Person Running", "Fire Detected", "Crowd Gathering", "No Event"
5. Log each detected event with a timestamp (in seconds from video start) and frame ID.
6. Assign `Incident_ID` values.

### Output CSV — `outputs/video_output.csv`
Columns: `Incident_ID`, `Timestamp`, `Frame_ID`, `Event_Detected`, `Objects`, `Confidence`

### Libraries
```
opencv-python
ultralytics
imageio
moviepy
```

---

## MODULE 5 — Text Analyst (`modules/text_analyst.py`)

### Purpose
Process social media posts and news article text using NLP to extract structured incident information.

### Input
- Directory: `data/text/`
- File types: `.csv` (columns: `id`, `text`, `source`)
- If no real CSV exists, **generate a synthetic dataset** of 20 rows using pandas, with realistic social media posts and news snippets describing incidents (fires, accidents, thefts, disturbances) in various cities. Include a mix of calm and urgent tones.

### Tasks
1. Clean and preprocess raw text: lowercase, remove URLs, special characters, extra whitespace; tokenize and remove stopwords using **NLTK**.
2. Run **spaCy NER** (`en_core_web_sm`) on each text to extract: people (`PERSON`), locations (`GPE`), organizations (`ORG`), dates (`DATE`). Store as a semicolon-separated string.
3. Run **sentiment analysis** using HuggingFace `transformers` pipeline (`distilbert-base-uncased-finetuned-sst-2-english`). Output: `POSITIVE` / `NEGATIVE` and a confidence score.
4. Run **zero-shot topic classification** using HuggingFace `transformers` pipeline (`facebook/bart-large-mnli`) with candidate labels: `["accident", "fire", "theft", "public disturbance", "other"]`. Assign the top label as the topic.
5. Group rows into 5 `Incident_ID` buckets (e.g., 4 texts per incident) to align with the other modules.

### Output CSV — `outputs/text_output.csv`
Columns: `Incident_ID`, `Text_ID`, `Source`, `Raw_Text`, `Sentiment`, `Entities`, `Topic`

### Libraries
```
spacy
transformers
nltk
pandas
```

---

## MODULE 6 — Integrator (`modules/integrator.py`)

### Purpose
Merge all five CSV outputs into a single unified incident report, compute severity, and save the final dataset.

### Tasks
1. Load all five output CSVs into pandas DataFrames.
2. Since multiple rows may share an `Incident_ID` (e.g., multiple video frames or texts), **aggregate each CSV to one row per `Incident_ID`** before merging:
   - Numeric fields: take the mean.
   - Text/list fields: join unique values with ` | `.
3. Merge all five aggregated DataFrames using `pd.merge` with `outer` join on `Incident_ID`.
4. Handle missing values:
   - Fill missing numeric scores with `0.0`.
   - Fill missing text fields with `"N/A"`.
5. Compute a **Severity Score** (0–10) as a weighted combination:
   ```
   severity = (
       Urgency_Score * 3.0 +           # from audio
       (1 if Incident_Type != "N/A" else 0) * 2.0 +  # from documents
       Confidence_Score * 2.0 +        # from images
       Confidence (video avg) * 2.0 +  # from video
       (1 if Sentiment == "NEGATIVE" else 0) * 1.0    # from text
   )
   ```
6. Classify **Severity Level**:
   - `0–3` → "Low"
   - `3–6` → "Medium"
   - `6–10` → "High"
7. Save to `outputs/final_integrated_report.csv`.

### Output CSV — `outputs/final_integrated_report.csv`
Columns: `Incident_ID`, `Transcript`, `Extracted_Event`, `Urgency_Score`, `Incident_Type`, `Date`, `Location`, `Officer`, `Scene_Type`, `Objects_Detected`, `Event_Detected`, `Topic`, `Entities`, `Sentiment`, `Severity_Score`, `Severity_Level`

---

## MODULE 7 — Dashboard (`dashboard/app.py`)

### Purpose
A **Streamlit** web app to display, filter, and explore the final integrated incident report.

### Features
1. **Header**: Title "Multimodal Incident Report Analyzer" with a subtitle showing total incident count and date.
2. **Sidebar Filters**:
   - Severity Level: multiselect (Low / Medium / High)
   - Incident Type: multiselect (populated from data)
   - Urgency Score: slider (0.0 to 1.0)
3. **Main Table**: Display filtered `final_integrated_report.csv` with color-coded severity (red = High, orange = Medium, green = Low) using `st.dataframe` with conditional styling.
4. **Charts** (use `plotly.express`):
   - Bar chart: Incident count by `Severity_Level`
   - Bar chart: Incident count by `Topic` (from text module)
   - Bar chart: Incident count by `Scene_Type` (from image module)
5. **Incident Detail Expander**: Click to expand any row and see all fields in a clean layout.
6. **Export Button**: Download the filtered dataset as a CSV using `st.download_button`.

### Libraries
```
streamlit
plotly
pandas
```

### Run Command
```bash
streamlit run dashboard/app.py
```

---

## MAIN PIPELINE (`main.py`)

Wire all modules together in sequence:

```python
from modules.audio_analyst import run_audio_pipeline
from modules.document_analyst import run_document_pipeline
from modules.image_analyst import run_image_pipeline
from modules.video_analyst import run_video_pipeline
from modules.text_analyst import run_text_pipeline
from modules.integrator import run_integration

if __name__ == "__main__":
    print("=== Running Audio Module ===")
    run_audio_pipeline()
    print("=== Running Document Module ===")
    run_document_pipeline()
    print("=== Running Image Module ===")
    run_image_pipeline()
    print("=== Running Video Module ===")
    run_video_pipeline()
    print("=== Running Text Module ===")
    run_text_pipeline()
    print("=== Running Integration ===")
    run_integration()
    print("✅ Full pipeline complete. Open outputs/final_integrated_report.csv")
    print("Run: streamlit run dashboard/app.py")
```

Each `run_*` function should:
- Auto-create its input `data/` subfolder if missing.
- Generate synthetic data if the folder is empty.
- Process all files found.
- Save its output CSV to `outputs/`.
- Print a progress summary at the end.

---

## REQUIREMENTS.TXT

```
openai-whisper
spacy
transformers
torch
gTTS
pdfplumber
pymupdf
pytesseract
Pillow
reportlab
ultralytics
opencv-python
imageio
moviepy
nltk
pandas
streamlit
plotly
requests
```

Also run after install:
```bash
python -m spacy download en_core_web_sm
```

---

## CODE QUALITY REQUIREMENTS

- Every module must have a `if __name__ == "__main__":` block so it can be run standalone.
- Use `pathlib.Path` for all file paths (not hardcoded strings).
- Add `try/except` error handling around model loading and file I/O — print a warning and skip the file on failure rather than crashing.
- Add docstrings to all functions.
- Print a summary table to console at the end of each module (use `pandas.DataFrame.to_string()`).
- All outputs must be deterministic (set random seeds where applicable).

---

## GETTING STARTED (README instructions to generate)

```bash
# 1. Install dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# 2. Run the full pipeline (generates synthetic data automatically)
python main.py

# 3. Launch the dashboard
streamlit run dashboard/app.py
```

The system should work **out of the box with zero manual data downloads** — all synthetic data is auto-generated on first run.
