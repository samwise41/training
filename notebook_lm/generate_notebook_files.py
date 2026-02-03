import os
import json
import requests
import datetime

# --- CONFIGURATION ---
# Output folder
OUTPUT_DIR = "notebook_lm"

# Map of Source URLs to Output Filenames
SOURCES = [
    {
        "url": "https://raw.githubusercontent.com/samwise41/training/main/data/training_log.json",
        "filename": "training_log.md",
        "title": "Training Log History"
    },
    {
        "url": "https://raw.githubusercontent.com/samwise41/training/main/data/metrics/coaching_view.json",
        "filename": "coaching_view.md",
        "title": "Current Coaching Metrics View"
    },
    {
        "url": "https://raw.githubusercontent.com/samwise41/training/main/data/trends/adherence.json",
        "filename": "adherence.md",
        "title": "Training Adherence Trends"
    },
    {
        "url": "https://raw.githubusercontent.com/samwise41/training/main/data/trends/trends.json",
        "filename": "trends.md",
        "title": "Long Term Trends"
    },
    {
        "url": "https://raw.githubusercontent.com/samwise41/training/main/data/readiness/readiness.json",
        "filename": "readiness.md",
        "title": "Daily Readiness Scores"
    },
    {
        "url": "https://raw.githubusercontent.com/samwise41/training/main/data/zones/profile.json",
        "filename": "profile.md",
        "title": "Athlete Profile and Zones"
    }
]

def ensure_dir(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)
        print(f"📂 Created directory: {directory}")

def fetch_and_save():
    print(f"🚀 Starting NotebookLM Data Generation...")
    ensure_dir(OUTPUT_DIR)
    
    generated_count = 0

    for source in SOURCES:
        url = source['url']
        filename = source['filename']
        title = source['title']
        output_path = os.path.join(OUTPUT_DIR, filename)
        
        print(f"   ⬇️  Fetching {filename}...")
        
        try:
            response = requests.get(url)
            response.raise_for_status() # Check for HTTP errors
            
            # Parse JSON to ensure it's valid and pretty-print it
            data = response.json()
            pretty_json = json.dumps(data, indent=2)
            
            # Create Markdown Content
            md_content = f"""# {title}
**Generated:** {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Source:** {url}

---

## Data Content
```json
{pretty_json}
