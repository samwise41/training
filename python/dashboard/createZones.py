import json
import os
import re

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLAN_FILE = os.path.join(BASE_DIR, 'endurance_plan.md')
OUTPUT_FILE = os.path.join(BASE_DIR, 'data', 'zones', 'zones.json')

def parse_zone_table(content, header_title):
    """
    Finds the section under the header and parses the markdown table rows.
    """
    # 1. Find the section content under the specific header
    # This looks for the header and grabs everything until the next header (###)
    pattern = rf"{re.escape(header_title)}.*?\n(.*?)(?=\n###|\Z)"
    section_match = re.search(pattern, content, re.DOTALL | re.IGNORECASE)
    
    if not section_match:
        print(f"⚠️ Could not find section: {header_title}")
        return []

    section_text = section_match.group(1).strip()
    zones = []

    # 2. Parse table rows
    # Pattern matches | Column 1 | Column 2 |
    for line in section_text.split('\n'):
        if '|' not in line:
            continue
            
        # Split by pipe and clean whitespace
        cols = [c.strip() for c in line.split('|') if c.strip()]
        
        if len(cols) < 2:
            continue
            
        name = cols[0]
        val = cols[1]
        
        # Skip header rows and separator rows (e.g., | Zone | Range | or |:---|:---|)
        if name.lower() == 'zone' or '---' in name:
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
        print(f"❌ Error reading file: {e}")
        return

    # 1. Parse Tables using your exact headers
    cycling_zones = parse_zone_table(content, "### Cycling Power Zones")
    running_zones = parse_zone_table(content, "### Running Heart Rate Zones")

    # 2. Final JSON Structure
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

    # 3. Ensure output directory exists and save
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(zones_data, f, indent=4)
        
    print(f"✅ Zones definitions generated: {len(cycling_zones)} cycling, {len(running_zones)} running.")

if __name__ == "__main__":
    main()