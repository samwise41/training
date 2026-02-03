import os
import json
import requests
import datetime

# --- CONFIGURATION ---
OUTPUT_DIR = "notebook_lm"

SOURCES = [
    {
        "url": "[https://raw.githubusercontent.com/samwise41/training/main/data/training_log.json](https://raw.githubusercontent.com/samwise41/training/main/data/training_log.json)",
        "filename": "training_log.md",
        "title": "Training Log History"
    },
    {
        "url": "[https://raw.githubusercontent.com/samwise41/training/main/data/metrics/coaching_view.json](https://raw.githubusercontent.com/samwise41/training/main/data/metrics/coaching_view.json)",
        "filename": "coaching_view.md",
        "title": "Current Coaching Metrics View"
    },
    {
        "url": "[https://raw.githubusercontent.com/samwise41/training/main/data/trends/adherence.json](https://raw.githubusercontent.com/samwise41/training/main/data/trends/adherence.json)",
        "filename": "adherence.md",
        "title": "Training Adherence Trends"
    },
    {
        "url": "[https://raw.githubusercontent.com/samwise41/training/main/data/trends/trends.json](https://raw.githubusercontent.com/samwise41/training/main/data/trends/trends.json)",
        "filename": "trends.md",
        "title": "Long Term Trends"
    },
    {
        "url": "[https://raw.githubusercontent.com/samwise41/training/main/data/readiness/readiness.json](https://raw.githubusercontent.com/samwise41/training/main/data/readiness/readiness.json)",
        "filename": "readiness.md",
        "title": "Daily Readiness Scores"
    },
    {
        "url": "[https://raw.githubusercontent.com/samwise41/training/main/data/zones/profile.json](https://raw.githubusercontent.com/samwise41/training/main/data/zones/profile.json)",
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
    # Safe backticks variable
    ticks = "```"

    for source in SOURCES:
        url = source['url']
        filename = source['filename']
        title = source['title']
        output_path = os.path.join(OUTPUT_DIR, filename)
        
        print(f"   ⬇️  Fetching {filename}...")
        
        try:
            response = requests.get(url)
            response.raise_for_status()
            
            data = response.json()
            pretty_json = json.dumps(data, indent=2)
            
            # SAFE STRING CONSTRUCTION (No triple-quotes)
            lines = [
                f"# {title}",
                f"**Generated:** {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                f"**Source:** {url}",
                "",
                "---",
                "",
                "## Data Content",
                f"{ticks}json",
                pretty_json,
                ticks,
                ""
            ]
            
            md_content = "\n".join(lines)

            with open(output_path, "w", encoding="utf-8") as f:
                f.write(md_content)
                
            generated_count += 1
            
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Network Error fetching {filename}: {e}")
        except json.JSONDecodeError:
            print(f"   ❌ JSON Error: The content from {url} was not valid JSON.")
        except Exception as e:
            print(f"   ❌ Error saving {filename}: {e}")

    print(f"\n✅ Completed. Generated {generated_count} files in '{OUTPUT_DIR}/'.")

if __name__ == "__main__":
    fetch_and_save()
