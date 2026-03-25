# Multimodal Crime / Incident Report Analyzer

This project runs **four separate tools** that read your data (images, 911 call text, CCTV videos, and social/news text) and save results as spreadsheet files. A **web dashboard** shows everything in one place.

You do **not** need to understand machine learning to run it—just follow the steps below.

**GitHub:** [Multimodal-Crime-Incident-Report-Analyzer](https://github.com/AdithyaReddyGeeda/Multimodal-Crime-Incident-Report-Analyzer)

---

## What you need on your computer

| Thing | Why |
|--------|-----|
| **Python 3.9+** | Runs the analysis scripts |
| **Node.js** (LTS) | Runs the dashboard in the browser |
| **Internet** | First run may download AI models (can be large and slow) |

**Optional but useful**

- **Tesseract** — only if you care about reading text inside images (OCR).  
  Mac: `brew install tesseract` · Ubuntu: `sudo apt install tesseract-ocr`
- **Roboflow API key** — only for the cloud image model. Put it in `.env` (see below). If you skip it, the project can still use a local backup model.

---

## One-time setup (do this first)

Open a terminal and go to the **project folder** (the folder that contains `modules/` and `dashboard/`).

```bash
cd "/path/to/AI for engineers assignment 3"
```

**1. Python packages**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

On Windows, use: `.venv\Scripts\activate`

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python -m nltk.downloader stopwords punkt punkt_tab
```

**2. API key (images only — optional)**

```bash
cp .env.example .env
```

Edit `.env` and add your key:

```env
ROBOFLOW_API_KEY=paste_your_key_here
```

Never upload `.env` to GitHub. It is ignored on purpose.

**3. Dashboard packages** (once)

```bash
cd dashboard
npm install
cd ..
```

---

## Where to put your data

| You want to run… | Put files here |
|------------------|----------------|
| **Images** (fire detection) | `fire-detection.v1i.yolov8/test/images/` — photos `.jpg`, `.jpeg`, `.png` |
| **Audio** (911 calls) | Put `data/audio/transcripts.csv` OR put `.mp3`/`.wav` in `data/audio/` and run `python3 transcribe_audio.py` first |
| **Videos** | `data/videos/` — e.g. `.mpg`, `.mp4` |
| **Text** (CrimeReport from Kaggle) | `data/text/` — file named `crimereport.csv`, `crimereport.txt`, or `CrimeReport.txt` |

If a folder or file is missing, that part will **skip** or **show an error** until you add data.

---

## Run the tools (from the project root)

Always run Python commands from the folder that contains `modules/`, **not** from inside `dashboard/`.

**Run each script you need** (skip any you do not have data for):

```bash
cd "/path/to/AI for engineers assignment 3"
source .venv/bin/activate

python3 modules/image_analyst.py
python3 modules/audio_analyst.py
python3 modules/video_analyst.py
python3 modules/text_analyst.py
```

**Copy results into the dashboard:**

```bash
python3 sync_dashboard_data.py
```

**Open the website:**

```bash
cd dashboard
npm run dev
```

Your browser will show a local address (often `http://localhost:5173`). Open it.

---

## What each script does (simple)

| Script | Plain English |
|--------|----------------|
| `image_analyst.py` | Looks at each test image, tries to detect fire/smoke-style objects, reads any visible text. Writes `outputs/image_output.csv`. IDs look like **IMG-001**, **IMG-002**, … |
| `audio_analyst.py` | Reads every row in `data/audio/transcripts.csv`, finds places and event types, scores urgency. Writes `outputs/audio_output.csv`. IDs look like **AUD-001**, … |
| `video_analyst.py` | Scans all videos in `data/videos/`, finds motion, detects objects. Writes **one line per event** to `outputs/video_output.csv`. IDs look like **VID-001**, … (many rows if the video is long). |
| `text_analyst.py` | Reads the full CrimeReport-style file, pulls names/places, sentiment, and topic. Writes `outputs/text_output.csv`. IDs look like **TXT-001**, … |
| `sync_dashboard_data.py` | Copies the CSV results into JavaScript files under `dashboard/src/data/` so the website can read them. |

**Full runs can take a long time** (especially video and large text files). Be patient.

---

## Quick paths (copy-paste)

**Only images + dashboard**

```bash
python3 modules/image_analyst.py
python3 sync_dashboard_data.py
cd dashboard && npm run dev
```

**Everything you have data for**

```bash
python3 transcribe_audio.py
python3 modules/image_analyst.py
python3 modules/audio_analyst.py
python3 modules/video_analyst.py
python3 modules/text_analyst.py
python3 sync_dashboard_data.py
cd dashboard && npm run dev
```

---

## If something goes wrong

- **`can't open file '.../dashboard/modules/...'`** — You are in the wrong folder. `cd` to the project root (where `modules` lives), then run `python3 modules/...` again.
- **Missing CSV** — Run the matching `*_analyst.py` first, or add the data files listed above.
- **`.env` / API** — Image cloud features need `ROBOFLOW_API_KEY` in `.env`. Without it, the tool may still work using the local fallback model.

---

## Project layout (short)

| Folder / file | What it is |
|---------------|------------|
| `modules/` | Python analysis scripts (`image_analyst.py`, `audio_analyst.py`, `video_analyst.py`, `text_analyst.py`) |
| `outputs/` | Result spreadsheets (`*_output.csv`) |
| `sync_dashboard_data.py` | Copies CSVs into the dashboard |
| `dashboard/` | Web app — run `npm run dev` inside here |
| `requirements.txt` | Python dependencies |
| `.env` | Your private API key (do not share) |

---

## License and data

This project uses third-party **datasets** and **services** (Roboflow, Kaggle, Hugging Face, etc.). Follow their rules. Do not commit passwords, API keys, or private data you should not share.
