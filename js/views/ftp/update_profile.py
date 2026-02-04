import re
import json
import os

# --- CONFIGURATION ---
def find_project_root():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    for _ in range(5):
        if os.path.exists(os.path.join(current_dir, 'endurance_plan.md')):
            return current_dir
        parent = os.path.dirname(current_dir)
        if parent == current_dir: break
        current_dir = parent
    return None

PROJECT_ROOT = find_project_root()

# W/kg Categories
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
    if not PROJECT_ROOT:
        print("❌ CRITICAL ERROR: Could not find 'endurance_plan.md'.")
        return

    plan_file = os.path.join(PROJECT_ROOT, 'endurance_plan.md')
    output_file = os.path.join(PROJECT_ROOT, 'data', 'zones', 'profile.json')

    with open(plan_file, 'r', encoding='utf-8') as f:
        content = f.read()

    print(f"🔍 Scanning {os.path.basename(plan_file)}...")

    # --- 1. ROBUST REGEX EXTRACTION ---
    
    # Weight: Matches "Weight: 178" or "Weight: 178 lbs"
    weight_str = extract_value(content, [
        r'Weight[:\s|*]+(\d+)', 
        r'Body Weight[:\s|*]+(\d+)'
    ])
    weight = int(weight_str) if weight_str else 175
    
    # Cycling FTP: Matches "Cycling FTP: 241"
    watts_str = extract_value(content, [
        r'Cycling FTP[:\s|*]+(\d+)', 
        r'FTP[:\s|*]+(\d+)\s*w'
    ])
    watts = int(watts_str) if watts_str else 0
    
    # LTHR: Matches "Lactate Threshold HR (LTHR): 171" or "LTHR: 171"
    # The '.*?' ignores the "(LTHR)" part
    lthr_str = extract_value(content, [
        r'Lactate Threshold HR.*?:[:\s|*]+(\d+)', 
        r'LTHR[:\s|*)]+(\d+)', 
        r'Threshold HR[:\s|*]+(\d+)'
    ])
    lthr = lthr_str if lthr_str else "--"
    
    # Run FTP: Matches "Functional Threshold Pace (FTP): 7:45"
    run_ftp_str = extract_value(content, [
        r'Functional Threshold Pace.*?:[:\s|*]+([\d:]+)',
        r'Threshold Pace.*?:[:\s|*]+([\d:]+)',
        r'Run FTP[:\s|*]+([\d:]+)'
    ])
    run_ftp = run_ftp_str if run_ftp_str else "--"

    # 5K: Matches "5K Prediction: ~23:42" (Handles the tilde)
    five_k_str = extract_value(content, [
        r'5K Prediction[:\s|*~]+([\d:]+)', 
        r'5k Estimate[:\s|*~]+([\d:]+)',
        r'5k[:\s|*~]+([\d:]+)'
    ])
    five_k = five_k_str if five_k_str else "--"

    # --- 2. CALCULATIONS ---
    weight_kg = weight * 0.453592
    wkg_num = round(watts / weight_kg, 2) if (watts > 0 and weight_kg > 0) else 0.00

    category = CATEGORIES[-1]
    for cat in CATEGORIES:
        if wkg_num >= cat["threshold"]:
            category = cat
            break
            
    min_scale, max_scale = 1.0, 6.0
    percent = max(0, min((wkg_num - min_scale) / (max_scale - min_scale), 1))

    # --- 3. SAVE ---
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

    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(profile_data, f, indent=4)

    print(f"✅ Success! Data extracted to: {output_file}")
    print(f"   • Cycling FTP: {watts}W")
    print(f"   • Run FTP: {run_ftp}")
    print(f"   • LTHR: {lthr}")
    print(f"   • 5K Est: {five_k}")

if __name__ == "__main__":
    parse_plan()
