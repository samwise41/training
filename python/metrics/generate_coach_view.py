import json
import os
import datetime
from statistics import mean

# --- PATH CONFIGURATION ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))

INPUT_LOG = os.path.join(PROJECT_ROOT, 'data', 'training_log.json')
INPUT_CONFIG = os.path.join(PROJECT_ROOT, 'data', 'metrics', 'metrics_config.json')
OUTPUT_FILE = os.path.join(PROJECT_ROOT, 'data', 'metrics', 'coaching_view.json')

# --- DEFINITIONS (Must match the rows in your Metrics Tab) ---
METRIC_GROUPS = [
    {'name': 'General Fitness', 'keys': ['vo2max', 'tss', 'feeling_load']},
    {'name': 'Cycling Metrics', 'keys': ['subjective_bike', 'endurance']},
    {'name': 'Running Metrics', 'keys': ['subjective_run', 'mechanical']},
    # Add 'swim' here if you have metrics for it
]

def load_json(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def safe_float(val):
    try:
        if val is None: return None
        return float(val)
    except (ValueError, TypeError):
        return None

def get_days_ago(date_str):
    if not date_str: return 9999
    try:
        d = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
        delta = datetime.date.today() - d
        return delta.days
    except ValueError:
        return 9999

def calculate_slope(values):
    """Calculates linear regression slope."""
    n = len(values)
    if n < 2: return 0
    x = list(range(n))
    y = values
    mean_x = mean(x)
    mean_y = mean(y)
    numerator = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y))
    denominator = sum((xi - mean_x) ** 2 for x in x)
    if denominator == 0: return 0
    return numerator / denominator

def get_trend_label(slope, higher_is_better=True):
    """Returns 'Rising', 'Falling', or 'Flat'."""
    threshold = 0.0001
    if abs(slope) < threshold: return "Flat"
    
    # If slope is positive (+)
    if slope > 0:
        return "Rising" # e.g. Rising Power (Good) or Rising HR (Bad?)
        # We generally describe the direction of the number, let the LLM decide if that's good.
    else:
        return "Falling"

def extract_metric_series(log, metric_key):
    """Extracts values for a specific metric key over time."""
    series = []
    
    for entry in log:
        if entry.get('exclude') is True: continue
        
        val = None
        
        # 1. Direct value lookup
        if metric_key in entry and entry[metric_key] is not None:
            val = safe_float(entry[metric_key])
            
        # 2. Calculated values (Derived)
        elif metric_key == 'subjective_bike':
            p = safe_float(entry.get('avgPower'))
            r = safe_float(entry.get('RPE'))
            if p and r and r > 0: val = p / r
            
        elif metric_key == 'subjective_run':
            s = safe_float(entry.get('averageSpeed'))
            r = safe_float(entry.get('RPE'))
            if s and r and r > 0: val = s / r

        elif metric_key == 'endurance': # Efficiency Factor
            p = safe_float(entry.get('avgPower'))
            h = safe_float(entry.get('averageHR'))
            if p and h and h > 0: val = p / h

        elif metric_key == 'mechanical': # Vert Ratio approx
            v = safe_float(entry.get('avgVerticalOscillation'))
            g = safe_float(entry.get('avgGroundContactTime'))
            if v and g and g > 0: val = (v / g) * 100

        elif metric_key == 'feeling_load':
            f = safe_float(entry.get('Feeling'))
            if f is not None: val = f # Just track feeling for now

        if val is not None:
             series.append({
                 'date': entry['date'], 
                 'days_ago': get_days_ago(entry['date']),
                 'value': val
             })
             
    # Sort by date OLD -> NEW
    series.sort(key=lambda x: x['date'])
    return series

def process_data():
    print("--- Generating Aggregated Coaching View ---")
    log = load_json(INPUT_LOG)
    config = load_json(INPUT_CONFIG)
    
    if not log or not config:
        print("Error: Missing input files.")
        return

    # Structure the output for the Dashboard
    output_data = {
        "generated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "metrics_summary": []
    }

    for group in METRIC_GROUPS:
        group_output = {
            "group": group['name'],
            "metrics": []
        }
        
        for key in group['keys']:
            # Get rules from config
            rule = config.get('metrics', {}).get(key, {})
            good_min = rule.get('good_min')
            good_max = rule.get('good_max')
            higher_is_better = rule.get('higher_is_better', True)
            
            # Get Data
            series = extract_metric_series(log, key)
            if not series: 
                continue

            # 1. Status (Last 30 Days Average)
            recent = [x['value'] for x in series if x['days_ago'] <= 30]
            current_avg = mean(recent) if recent else 0
            
            status = "Neutral"
            if recent:
                if higher_is_better:
                    if good_min is not None and current_avg >= good_min: status = "On Target"
                    elif good_min is not None: status = "Off Target"
                else:
                    if good_max is not None and current_avg <= good_max: status = "On Target"
                    elif good_max is not None: status = "Off Target"

            # 2. Trends (30, 60, 90 Days)
            trends = {}
            for period in [30, 60, 90]:
                subset = [x['value'] for x in series if x['days_ago'] <= period]
                slope = calculate_slope(subset)
                trends[f"{period}d"] = get_trend_label(slope, higher_is_better)

            # Add to list
            group_output['metrics'].append({
                "id": key,
                "label": rule.get('title', key),
                "current_value": round(current_avg, 2),
                "unit": rule.get('unit', ''),
                "status": status,
                "trends": trends,
                "target": f"{good_min} - {good_max}" if (good_min or good_max) else "N/A"
            })
            
        if group_output['metrics']:
            output_data['metrics_summary'].append(group_output)

    # Save
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2)
        
    print(f"Success! Aggregated view saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    process_data()
