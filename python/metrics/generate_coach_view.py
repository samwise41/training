import json
import os

# --- PATH CONFIGURATION ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))

INPUT_LOG = os.path.join(PROJECT_ROOT, 'data', 'training_log.json')
INPUT_CONFIG = os.path.join(PROJECT_ROOT, 'data', 'metrics', 'metrics_config.json')
OUTPUT_FILE = os.path.join(PROJECT_ROOT, 'data', 'metrics', 'coaching_view.json')

def load_json(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
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

def sanitize(val):
    """Converts None to 0.0 to prevent TypeErrors in comparisons."""
    if val is None:
        return 0.0
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0.0

def calculate_metrics(activity):
    metrics = {}
    
    # Extract and SANITIZE fields (Critical Fix)
    # .get() returns None if key exists but is null. 'or 0' fixes that.
    pwr = sanitize(activity.get('avgPower'))
    hr = sanitize(activity.get('averageHR'))
    speed = sanitize(activity.get('averageSpeed'))
    rpe = sanitize(activity.get('RPE'))
    vert = sanitize(activity.get('avgVerticalOscillation'))
    gct = sanitize(activity.get('avgGroundContactTime'))
    
    sport = str(activity.get('activityType', '')).lower()
    actual_sport = str(activity.get('actualSport', '')).lower()
    
    # Combine sport checks for robustness
    is_bike = 'cycling' in sport or 'bike' in actual_sport or 'virtual_ride' in sport
    is_run = 'running' in sport or 'run' in actual_sport
    
    # --- 1. Subjective Efficiency (Bike) ---
    if is_bike and pwr > 0 and rpe > 0:
        metrics['subjective_bike'] = round(safe_div(pwr, rpe), 2)

    # --- 2. Subjective Efficiency (Run) ---
    if is_run and speed > 0 and rpe > 0:
        metrics['subjective_run'] = round(safe_div(speed, rpe), 2)

    # --- 3. Endurance (Efficiency Factor: Power / HR) ---
    if is_bike and pwr > 0 and hr > 0:
        metrics['endurance'] = round(safe_div(pwr, hr), 2)

    # --- 4. Mechanical (Run: Vert / GCT) ---
    if is_run and vert > 0 and gct > 0:
        metrics['mechanical'] = round(safe_div(vert, gct) * 100, 2)

    return metrics

def grade_metric(metric_key, value, config):
    if 'metrics' not in config or metric_key not in config['metrics']:
        return 'Neutral'

    rules = config['metrics'][metric_key]
    min_v = rules.get('good_min')
    max_v = rules.get('good_max')
    higher_is_better = rules.get('higher_is_better', True)

    if higher_is_better:
        if min_v is not None and value < min_v: return 'Miss'
        return 'Good'
    else:
        if max_v is not None and value > max_v: return 'Miss'
        return 'Good'

def process_data():
    print(f"--- Starting Coaching View Generation ---")
    print(f"Reading from: {INPUT_LOG}")
    
    raw_data = load_json(INPUT_LOG)
    config = load_json(INPUT_CONFIG)
    
    if not raw_data:
        print("ABORTING: No training data found.")
        return

    processed_log = []

    for entry in raw_data:
        if entry.get('exclude') is True:
            continue
            
        processed_entry = {
            'date': entry.get('date'),
            'name': entry.get('activityName') or entry.get('actualWorkout') or 'Activity',
            'type': entry.get('activityType'),
            'metrics': {}
        }

        calculated = calculate_metrics(entry)

        for key, val in calculated.items():
            grade = grade_metric(key, val, config)
            label = "Metric"
            if 'metrics' in config and key in config['metrics']:
                label = config['metrics'][key].get('title', key)

            processed_entry['metrics'][key] = {
                'value': val,
                'grade': grade,
                'label': label
            }

        if processed_entry['metrics']:
            processed_log.append(processed_entry)

    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(processed_log, f, indent=2)
    
    print(f"Success! Generated metrics for {len(processed_log)} activities.")
    print(f"Saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    process_data()
