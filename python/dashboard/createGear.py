import json
import re
from pathlib import Path

# --- Configuration ---
BASE_DIR = Path(__file__).parent.parent.parent
INPUT_PATH = BASE_DIR / "js" / "views" / "gear" / "Gear.md"
OUTPUT_PATH = BASE_DIR / "data" / "gear" / "gear.json"

# Ensure output directory exists
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

def parse_temp_range(range_str):
    """
    Parses strings like "Below 40°F", "40°F – 45°F", "Above 70°F".
    Returns (min, max).
    """
    # Normalize: remove °F, deg, spaces, lowercase
    range_str = range_str.lower().replace("°f", "").replace("deg", "").strip()
    
    # Extract all numbers
    nums = [int(n) for n in re.findall(r'\d+', range_str)]
    
    # Logic for bounds
    if "below" in range_str or "<" in range_str:
        # e.g. "Below 35" -> -999 to 35
        return -999, nums[0] if nums else 0
    elif "above" in range_str or "+" in range_str or ">" in range_str:
        # e.g. "Above 60" -> 60 to 999
        return nums[0] if nums else 0, 999
    elif len(nums) >= 2:
        # e.g. "35 - 40" -> 35 to 40
        return nums[0], nums[1]
    
    return -999, 999 # Fallback if no numbers found

def parse_markdown_table(md_content, header_keywords):
    """
    Extracts a specific table from the Markdown text.
    header_keywords: list of strings to match in the header (e.g. ["Cycling", "Matrix"])
    """
    lines = md_content.split('\n')
    in_section = False
    data_rows = []
    
    for line in lines:
        stripped = line.strip()
        
        # 1. Detect Section Header
        # strict check: line must contain ALL keywords to avoid matching "Cycling Gear" instead of "Cycling Matrix"
        if stripped.startswith('##'):
            is_match = all(k.lower() in stripped.lower() for k in header_keywords)
            if is_match:
                in_section = True
                continue
            elif in_section:
                # If we were in a section and hit a NEW header that DOESN'T match, we stop.
                break
        
        # 2. Parse Table Row (only if inside the correct section)
        if in_section and stripped.startswith('|'):
            # Skip separator lines (e.g. | :--- |)
            if '---' in stripped:
                continue
            
            # Extract columns
            cols = [c.strip() for c in stripped.strip('|').split('|')]
            
            # Ensure valid row (Temp | Upper | Lower | Extremities)
            # Check length >= 4 and ensure it's not the Header row (which contains "Temp")
            if len(cols) >= 4 and "Temp" not in cols[0]:
                t_min, t_max = parse_temp_range(cols[0])
                
                data_rows.append({
                    "min": t_min,
                    "max": t_max,
                    "rangeLabel": cols[0], 
                    "upper": cols[1],
                    "lower": cols[2],
                    "extremities": cols[3]
                })
                
    return data_rows

def main():
    print("🚀 Generating Gear Data...")
    
    try:
        with open(INPUT_PATH, 'r', encoding='utf-8') as f:
            md_content = f.read()
    except FileNotFoundError:
        print(f"❌ Error: Source file not found at {INPUT_PATH}")
        # Create empty file so app doesn't crash
        with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump({"bike": [], "run": []}, f)
        return

    # Process Sections using specific keywords to avoid "Inventory" sections
    bike_data = parse_markdown_table(md_content, ["Cycling", "Matrix"])
    run_data = parse_markdown_table(md_content, ["Running", "Matrix"])

    output_data = {
        "bike": bike_data,
        "run": run_data,
        "lastUpdated": "Generated via Python"
    }

    # Save
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=4)
        
    print(f"✅ Gear data saved to: {OUTPUT_PATH}")
    print(f"   - Bike Rules: {len(bike_data)}")
    print(f"   - Run Rules: {len(run_data)}")

if __name__ == "__main__":
    main()