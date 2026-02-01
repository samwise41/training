import json
import os

# --- PATH CONFIGURATION ---
# 1. Find the directory where this script lives (python/metrics)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# 2. Go up two levels to find the Project Root
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))

# 3. Define paths relative to Project Root
INPUT_LOG = os.path.join(PROJECT_ROOT, 'data', 'training_log.json')
INPUT_CONFIG = os.path.join(PROJECT_ROOT, 'data', 'metrics', 'metrics_config.json')
OUTPUT_FILE = os.path.join(PROJECT_ROOT, 'data', 'metrics', 'coaching_view.json')

def load_json(filepath):
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: Could not find {filepath}")
        return {}
    except json.JSONDecodeError:
        print(f"Error: {filepath} is not valid JSON")
        return {}

def safe_div(num, den):
    if not den or den == 0: return 0
    return num / den

def calculate_metrics(activity):
    """
    Replicates the logic from parser.js to calculate derived metrics.
    """
    metrics = {}
    
    # Extract raw fields safely
    pwr = activity.get('avgPower', 0)
    hr = activity.get('averageHR', 0)
    speed = activity.get('averageSpeed', 0)
    rpe = activity.get('RPE', 0)
    vert = activity.get('avgVerticalOscillation', 0)
    gct = activity.get('avgGroundContactTime', 0)
    sport = activity.get('activityType', '').lower()

    # --- 1. Subjective Efficiency (Bike) ---
    if 'cycling' in sport and pwr > 0 and rpe > 0:
        metrics['subjective_bike'] = round(safe_div(pwr, rpe), 2)

    # --- 2. Subjective Efficiency (Run) ---
    if 'running' in sport and speed > 0 and rpe > 0:
        metrics['subjective_run'] = round(safe_div(speed, rpe), 2)

    # --- 3. Endurance (Efficiency Factor: Power / HR) ---
    if 'cycling' in sport and pwr > 0 and hr > 0:
        metrics['endurance'] = round(safe_div(pwr, hr), 2)

    # --- 4. Mechanical (Run: Vert / GCT) ---
    if 'running' in sport and vert > 0 and gct > 0:
        metrics['mechanical'] = round(safe_div(vert, gct) * 100, 2)

    return metrics

def grade_metric(metric_key, value, config):
    """
    Compares a value against the metrics_config.json targets.
    Returns: 'Good', 'Miss', or 'Neutral'
    """
    # Safety check: does this metric exist in the config?
    if 'metrics' not in config or metric_key not in config['metrics']:
        return 'Neutral'

    rules = config['metrics'][metric_key]
    min_v = rules.get('good_min')
    max_v = rules.get('good_max')
    higher_is_better = rules.get('higher_is_better', True)

    # Logic for "Normal" (Higher is Better)
    if higher_is_better:
        if min_v is not None and value < min_v: return 'Miss'
        return 'Good'
    
    # Logic for "Inverted" (Lower is Better, e.g., Vertical Ratio)
    else:
        if max_v is not None and value > max_v: return 'Miss'
        return 'Good'

def process_data():
    print(f"--- Starting Coaching View Generation ---")
    print(f"Root:   {PROJECT_ROOT}")
    print(f"Config: {INPUT_CONFIG}")
    print(f"Log:    {INPUT_LOG}")
    
    raw_data = load_json(INPUT_LOG)
    config = load_json(INPUT_CONFIG)
    
    if not raw_data:
        print("ABORTING: No training data found.")
        return
    if not config:
        print("ABORTING: No configuration found.")
        return

    processed_log = []

    for entry in raw_data:
        # Skip excluded activities
        if entry.get('exclude') is True:
            continue
            
        # 1. Base Data
        processed_entry = {
            'date': entry.get('date'),
            'name': entry.get('activityName', 'Activity'),
            'type': entry.get('activityType'),
            'metrics': {}
        }

        # 2. Calculate Derived Metrics (The Math)
        calculated = calculate_metrics(entry)

        # 3. Grade Metrics (The Judgment)
        for key, val in calculated.items():
            grade = grade_metric(key, val, config)
            
            # Get label from config, default to key if missing
            label = "Metric"
            if 'metrics' in config and key in config['metrics']:
                label = config['metrics'][key].get('title', key)

            processed_entry['metrics'][key] = {
                'value': val,
                'grade': grade,
                'label': label
            }

        # Only add entries that actually have metrics
        if processed_entry['metrics']:
            processed_log.append(processed_entry)

    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    # Save to file
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(processed_log, f, indent=2)
    
    print(f"Success! Processed {len(processed_log)} activities.")
    print(f"Saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    process_data()
