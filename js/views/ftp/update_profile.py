import re
import json
import os

# --- CONFIGURATION ---
# ".." moves up one level from the "scripts" folder to the root
PLAN_FILE = os.path.join(os.path.dirname(__file__), '../endurance_plan.md')
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '../data/profile.json')

# W/kg Categories (Matches your JS config)
CATEGORIES = [
    { "threshold": 5.05, "label": "Exceptional", "color": "#a855f7" },
    { "threshold": 3.93, "label": "Very Good",   "color": "#3b82f6" },
    { "threshold": 2.79, "label": "Good",        "color": "#22c55e" },
    { "threshold": 2.23, "label": "Fair",        "color": "#f97316" },
    { "threshold": 0.00, "label": "Untrained",   "color": "#ef4444" }
]

def extract_value(text, patterns):
    """Helper to find a value using multiple regex patterns."""
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return None

def parse_plan():
    # Resolve absolute paths to avoid confusion
    plan_path = os.path.abspath(PLAN_FILE)
    output_path = os.path.abspath(OUTPUT_FILE)

    if not os.path.exists(plan_path):
        print(f"❌ Error: {plan_path} not found.")
        print("   Make sure you are running this from the root or scripts folder.")
        return

    with open(plan_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # --- 1. EXTRACT RAW DATA ---
    print(f"🔍 Scanning {os.path.basename(plan_path)} for Biometrics...")
    
    # Weight (lbs)
    weight_str = extract_value(content, [r'Weight[:\s|]+(\d+)', r'Body Weight[:\s|]+(\d+)'])
    weight = int(weight_str) if weight_str else 175 # Default
    
    # Cycling FTP (Watts)
    watts_str = extract_value(content, [r'Cycling FTP[:\s|*]+(\d+)', r'FTP[:\s|*]+(\d+)'])
    watts = int(watts_str) if watts_str else 0
    
    # LTHR
    lthr_str = extract_value(content, [r'LTHR[:\s|*]+(\d+)', r'Threshold HR[:\s|*]+(\d+)'])
    lthr = lthr_str if lthr_str else "--"
    
    # Run FTP (Pace)
    run_ftp_str = extract_value(content, [r'Run FTP[:\s|*]+([\d:]+)', r'Threshold Pace[:\s|*]+([\d:]+)'])
    run_ftp = run_ftp_str if run_ftp_str else "--"

    # 5k Estimate
    five_k_str = extract_value(content, [r'5k Estimate[:\s|*]+([\d:]+)', r'5k[:\s|*]+([\d:]+)'])
    five_k = five_k_str if five_k_str else "--"

    # --- 2. CALCULATE METRICS ---
    weight_kg = weight * 0.453592
    wkg_num = round(watts / weight_kg, 2) if (watts > 0 and weight_kg > 0) else 0.00

    # Determine Category
    category = CATEGORIES[-1] # Default to Untrained
    for cat in CATEGORIES:
        if wkg_num >= cat["threshold"]:
            category = cat
            break
            
    # Calculate Gauge Percent (1.0 to 6.0 scale)
    min_scale, max_scale = 1.0, 6.0
    percent = max(0, min((wkg_num - min_scale) / (max_scale - min_scale), 1))

    # --- 3. BUILD JSON ---
    profile_data = {
        "weight_lbs": weight,
        "weight_kg": round(weight_kg, 1),
        "ftp_watts": watts,
        "wkg": wkg_num,
        "lthr": lthr,
        "run_ftp_pace": run_ftp,
        "five_k_time": five_k,
        "category": category,
        "gauge_percent": percent
    }

    # --- 4. SAVE ---
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(profile_data, f, indent=4)

    print(f"✅ Success! Profile saved to {output_path}")
    print(f"   Stats: {watts}W / {weight}lbs = {wkg_num} W/kg ({category['label']})")

if __name__ == "__main__":
    parse_plan()
