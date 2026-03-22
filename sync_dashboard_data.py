"""Sync outputs/image_output.csv → dashboard/src/data/imageResults.js"""

import json
from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent
CSV_PATH = PROJECT_ROOT / "outputs" / "image_output.csv"
OUTPUT_JS = PROJECT_ROOT / "dashboard" / "src" / "data" / "imageResults.js"


def sync() -> None:
    if not CSV_PATH.exists():
        print(f"❌ CSV not found at {CSV_PATH}. Run python modules/image_analyst.py first.")
        return

    df = pd.read_csv(CSV_PATH)

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
    OUTPUT_JS.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_JS.write_text(js_content, encoding="utf-8")
    print(f"✅ Synced {len(records)} incidents to {OUTPUT_JS}")
    print("   Run: cd dashboard && npm run dev")


if __name__ == "__main__":
    sync()
