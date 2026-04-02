# Multimodal Crime / Incident Report Analyzer

Five small programs read your **images**, **911-style transcripts**, **videos**, **crime text**, and **PDF/Word documents**. They save results as CSV files. A **web dashboard** shows everything in one table.

You only need to copy-paste the commands below. You do not need to know how the AI works.

**GitHub repo:** [Multimodal-Crime-Incident-Report-Analyzer](https://github.com/AdithyaReddyGeeda/Multimodal-Crime-Incident-Report-Analyzer)

---

## What to install

| You need | For what |
|----------|----------|
| **Python 3.9+** | Running the analysis scripts |
| **Node.js** (LTS) | Running the dashboard in the browser |
| **Internet** | First run may download models (can be slow) |

**Nice to have**

- **Tesseract** — reads text inside images (OCR). Mac: `brew install tesseract`
- **Roboflow API key** — cloud image model. Put it in `.env`. Without it, a local backup model may still run.

---

## First-time setup

**1. Open the project folder** (the one that has `modules/` and `dashboard/`).

```bash
cd "/path/to/your/project-folder"
```

**2. Python**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Windows: `.venv\Scripts\activate`

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python -m nltk.downloader stopwords punkt punkt_tab
```

**3. API key (optional, for images)**

```bash
cp .env.example .env
```

Edit `.env` and set `ROBOFLOW_API_KEY=your_key`. Do **not** upload `.env` to GitHub.

**4. Dashboard (once)**

```bash
cd dashboard
npm install
cd ..
```

---

## Where your data goes

| What | Folder / file |
|------|----------------|
| Fire test images | `fire-detection.v1i.yolov8/test/images/` |
| 911 transcripts | `data/audio/transcripts.csv` (or transcribe from `data/audio/` with `transcribe_audio.py`) |
| Videos | `data/videos/` (e.g. `.mpg`, `.mp4`) |
| Crime text | `data/text/` — e.g. `crimereport.csv` or `CrimeReport.txt` |
| PDF / Word reports | `data/documents/` — `.pdf`, `.docx`, or `.txt` files |

If something is missing, that step may skip or warn you.

---

## How to run (always from the project root)

**Do not** run `python3 modules/...` from inside `dashboard/`. Stay in the folder that contains `modules/`.

### Easiest: run everything at once

```bash
cd "/path/to/your/project-folder"
source .venv/bin/activate

python3 main.py
```

That runs audio, image, video, text, documents, then merges all CSVs into `outputs/final_integrated_report.csv`.

### Or run each script yourself

```bash
python3 modules/audio_analyst.py
python3 modules/image_analyst.py
python3 modules/video_analyst.py
python3 modules/text_analyst.py
python3 modules/document_analyst.py
python3 modules/integrator.py
```

### Show results in the website

```bash
python3 sync_dashboard_data.py
cd dashboard
npm run dev
```

Open the link in the terminal (often `http://localhost:5173`).

---

## What each part does (short)

| File | What it does |
|------|----------------|
| `main.py` | Runs all five analysts + integrator in order. If one step fails, the rest still try to run. |
| `audio_analyst.py` | Reads `transcripts.csv` → `outputs/audio_output.csv` (**AUD-001**, …) |
| `image_analyst.py` | Reads test images → `outputs/image_output.csv` (**IMG-001**, …) |
| `video_analyst.py` | Reads videos → `outputs/video_output.csv` (**VID-001**, …) |
| `text_analyst.py` | Reads crime text → `outputs/text_output.csv` (**TXT-001**, …) |
| `document_analyst.py` | Reads `data/documents/*.{pdf,docx,txt}` (pdfplumber, PyMuPDF, OCR fallback) → `document_output.csv` with **Report_ID**, **Incident_Type**, **Date**, **Location**, **Officer**, **Summary**, plus suspect/outcome |
| `integrator.py` | Merges the five analyst CSVs → `outputs/final_integrated_report.csv` |
| `sync_dashboard_data.py` | Copies CSV data into `dashboard/src/data/` for the React app |

Big datasets can take a long time. That is normal.

---

## GitHub: put your code online (simple)

**A. Make a new empty repo on GitHub**  
GitHub.com → New repository → name it → **do not** add README if you already have one locally.

**B. In your project folder, run:**

First time (no git yet):

```bash
cd "/path/to/your/project-folder"
git init
git add .
git commit -m "Initial commit: multimodal incident analyzer"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with yours.

**Later, when you change files:**

```bash
git add .
git status
git commit -m "Short note what you changed"
git push
```

**If GitHub asks you to log in:** use a **Personal Access Token** as the password, or use **GitHub CLI** (`gh auth login`).

**Never commit secrets:** `.env` and API keys should stay local. This project should list `.env` in `.gitignore`.

---



## If something breaks

- **`No such file ... modules/...`** — You are in the wrong folder. `cd` to the project root, then run again.
- **No CSV in `outputs/`** — Run the matching `*_analyst.py` or `main.py` first.
- **Images need API** — Add `ROBOFLOW_API_KEY` in `.env`, or rely on the local fallback if your code supports it.



---

## Project layout

| Path | Meaning |
|------|---------|
| `modules/` | Python scripts for each data type + `integrator.py` |
| `outputs/` | CSV results |
| `main.py` | One command to run the full pipeline |
| `sync_dashboard_data.py` | Updates dashboard data from CSVs |
| `dashboard/` | React app — `npm run dev` here |
| `requirements.txt` | Python packages |

---

## License and data

This project may use third-party datasets and services. Follow their rules. Do not share private keys or data you are not allowed to publish.
