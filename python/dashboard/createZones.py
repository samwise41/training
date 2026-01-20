import json
import os
import re

# --- CONFIGURATION ---
# Establishes absolute paths to ensure the script works regardless of where it is called from.
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Assumes the script is located in root/python/zones/ or root/python/dashboard/
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "../../")) 
PLAN_FILE = os.path.join(ROOT_DIR, 'endurance_plan.md')
OUTPUT_FILE = os.path.join(ROOT_DIR, 'data', 'zones', 'zones.json')

def parse_zone_table(content, header_title):
    """
    Locates the section under a specific header and parses the markdown table rows.
    """
    # Find the section content starting with the header until the next header (###) or end of file
    pattern = rf"{re.escape(header_title)}.*?\n(.*?)(?=\n###|\Z)"
    section_match = re.search(pattern, content, re.DOTALL | re.IGNORECASE)
    
    if not section_match:
        print(f"⚠️ Header not found: {header_title}")
        return []

    section_text = section_match.group(1).strip()
    zones = []

    # Parse line by line to extract table data
    for line in section_text.split('\n'):
        if '|' not in line:
            continue
            
        # Extract columns and clean whitespace
        cols = [c.strip() for c in line.split('|') if c.strip()]
        
        if len(cols) < 2:
            continue
            
        name = cols[0]
        val = cols[1]
        
        # Skip markdown table structural elements (headers and separators)
        if name.lower() == 'zone' or '---' in name or ':---' in name:
            continue
            
        zones.append({
            "name": name,
            "range": val
        })
    
    return zones

def main():
    if not os.path.exists(PLAN_FILE):
        print(f"❌ Error: {PLAN_FILE} not found.")
        return

    try:
        with open(PLAN_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"❌ Error reading plan file: {e}")
        return

    # 1. Parse Tables using exact markdown headers
    cycling_zones = parse_zone_table(content, "### Cycling Power Zones")
    running_zones = parse_zone_table(content, "### Running Heart Rate Zones")

    # 2. Build the structured data for the Zones Tab
    zones_data = {
        "cycling": {
            "type": "Power",
            "unit": "Watts",
            "zones": cycling_zones
        },
        "running": {
            "type": "Heart Rate",
            "unit": "bpm",
            "zones": running_zones
        }
    }

    # 3. Ensure the output directory exists and save the result
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(zones_data, f, indent=4)
        print(f"✅ Zones definitions generated: {len(cycling_zones)} cycling, {len(running_zones)} running.")
        print(f"📂 Saved to: {OUTPUT_FILE}")
    except Exception as e:
        print(f"❌ Error saving JSON: {e}")

if __name__ == "__main__":
    main()