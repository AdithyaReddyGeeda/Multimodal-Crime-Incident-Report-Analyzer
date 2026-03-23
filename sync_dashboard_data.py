"""Sync outputs/*.csv → dashboard/src/data/*.js for the React dashboard."""

import json
from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent
IMAGE_CSV = PROJECT_ROOT / "outputs" / "image_output.csv"
AUDIO_CSV = PROJECT_ROOT / "outputs" / "audio_output.csv"
VIDEO_CSV = PROJECT_ROOT / "outputs" / "video_output.csv"
IMAGE_JS = PROJECT_ROOT / "dashboard" / "src" / "data" / "imageResults.js"
AUDIO_JS = PROJECT_ROOT / "dashboard" / "src" / "data" / "audioResults.js"
VIDEO_JS = PROJECT_ROOT / "dashboard" / "src" / "data" / "videoResults.js"


def sync_image() -> bool:
    if not IMAGE_CSV.exists():
        print(f"❌ Image CSV not found at {IMAGE_CSV}. Run: python modules/image_analyst.py")
        return False

    df = pd.read_csv(IMAGE_CSV)
    records = []
    for _, row in df.iterrows():
        records.append(
            {
                "incident_id": row["Incident_ID"],
                "image_id": row["Image_ID"],
                "scene_type": row["Scene_Type"],
                "objects_detected": row["Objects_Detected"],
                "text_extracted": row["Text_Extracted"],
                "confidence_score": round(float(row["Confidence_Score"]), 2),
            }
        )

    js_content = "export const imageResults = " + json.dumps(records, indent=2) + ";\n"
    IMAGE_JS.parent.mkdir(parents=True, exist_ok=True)
    IMAGE_JS.write_text(js_content, encoding="utf-8")
    print(f"✅ Synced {len(records)} image rows → {IMAGE_JS.relative_to(PROJECT_ROOT)}")
    return True


def sync_audio() -> bool:
    if not AUDIO_CSV.exists():
        print(f"❌ Audio CSV not found at {AUDIO_CSV}. Run: python modules/audio_analyst.py")
        return False

    df = pd.read_csv(AUDIO_CSV)
    records = []
    for _, row in df.iterrows():
        records.append(
            {
                "incident_id": row["Incident_ID"],
                "call_id": row["Call_ID"],
                "transcript": row["Transcript"],
                "extracted_event": row["Extracted_Event"],
                "location": row["Location"],
                "sentiment": row["Sentiment"],
                "urgency_score": round(float(row["Urgency_Score"]), 2),
            }
        )

    js_content = "export const audioResults = " + json.dumps(records, indent=2) + ";\n"
    AUDIO_JS.parent.mkdir(parents=True, exist_ok=True)
    AUDIO_JS.write_text(js_content, encoding="utf-8")
    print(f"✅ Synced {len(records)} audio rows → {AUDIO_JS.relative_to(PROJECT_ROOT)}")
    return True


def sync_video() -> bool:
    if not VIDEO_CSV.exists():
        print(f"❌ Video CSV not found at {VIDEO_CSV}. Run: python modules/video_analyst.py")
        return False

    df = pd.read_csv(VIDEO_CSV)
    records = []
    for _, row in df.iterrows():
        records.append(
            {
                "incident_id": row["Incident_ID"],
                "timestamp": round(float(row["Timestamp"]), 2),
                "frame_id": row["Frame_ID"],
                "event_detected": row["Event_Detected"],
                "objects": row["Objects"],
                "confidence": round(float(row["Confidence"]), 2),
            }
        )

    js_content = "export const videoResults = " + json.dumps(records, indent=2) + ";\n"
    VIDEO_JS.parent.mkdir(parents=True, exist_ok=True)
    VIDEO_JS.write_text(js_content, encoding="utf-8")
    print(f"✅ Synced {len(records)} video rows → {VIDEO_JS.relative_to(PROJECT_ROOT)}")
    return True


def sync() -> None:
    sync_image()
    sync_audio()
    sync_video()
    print("   Run: cd dashboard && npm run dev")


if __name__ == "__main__":
    sync()
