import json
import re
from pathlib import Path

# --- Configuration ---
BASE_DIR = Path(__file__).parent.parent.parent
# Note: Adjust source path if your Gear.md is located elsewhere
INPUT_PATH = BASE_DIR / "js" / "views" / "gear" / "Gear.md"
OUTPUT_PATH = BASE_DIR / "data" / "gear" / "gear.json"

# Ensure output directory exists
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

def parse_temp_range(range_str):
    """
    Parses strings like "Below 40°F", "40°F – 45°F", "Above 70°F".
    Returns (min, max).
    """
    range_str = range_str.lower().replace("°f", "").replace("deg", "").strip()
    nums = [int(n) for n in re.findall(r'\d+', range_str)]
    
    if "below" in range_str or "<" in range_str:
        return -999, nums[0] if nums else 0
    elif "above" in range_str or "+" in range_str or ">" in range_str:
        return nums[0] if nums else 0, 999
    elif len(nums) >= 2:
        return nums[0], nums[1]
    
    return -999, 999 # Fallback

def parse_markdown_table(md_content, header_keyword):
    """
    Extracts a specific table (Bike or Run) from the Markdown text.
    """
    lines = md_content.split('\n')
    in_section = False
    data_rows = []
    
    for line in lines:
        stripped = line.strip()
        
        # 1. Detect Section Header (e.g. ## 🌡️ Cycling Matrix)
        if stripped.startswith('##') and header_keyword.lower() in stripped.lower():
            in_section = True
            continue
        
        # 2. Stop at next header
        if in_section and stripped.startswith('##'):
            break
            
        # 3. Parse Table Row
        if in_section and stripped.startswith('|'):
            # Skip separator lines (e.g. | :--- |)
            if '---' in stripped:
                continue
            
            # Extract columns
            cols = [c.strip() for c in stripped.strip('|').split('|')]
            
            # Ensure valid row (Temp | Upper | Lower | Extremities)
            if len(cols) >= 4 and "Temp" not in cols[0]:
                t_min, t_max = parse_temp_range(cols[0])
                
                data_rows.append({
                    "min": t_min,
                    "max": t_max,
                    "rangeLabel": cols[0], # Keep original label for reference
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
        return

    # Process Sections
    bike_data = parse_markdown_table(md_content, "Cycling")
    run_data = parse_markdown_table(md_content, "Running")

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