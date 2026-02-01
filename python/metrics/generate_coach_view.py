import json
import os
import datetime
from statistics import mean
import math

# --- PATH CONFIGURATION ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))

INPUT_LOG = os.path.join(PROJECT_ROOT, 'data', 'training_log.json')
INPUT_CONFIG = os.path.join(PROJECT_ROOT, 'data', 'metrics', 'metrics_config.json')
OUTPUT_FILE = os.path.join(PROJECT_ROOT, 'data', 'metrics', 'coaching_view.json')

# --- DEFINITIONS (Mapping to your table.js groups) ---
METRIC_GROUPS = [
    {'name': 'General Fitness', 'keys': ['vo2max', 'tss', 'anaerobic']},
    {'name': 'Cycling Metrics', 'keys': ['subjective_bike', 'endurance', 'strength']},
    {'name': 'Running Metrics', 'keys': ['subjective_run', 'run', 'mechanical', 'gct', 'vert']},
    {'name': 'Swimming Metrics', 'keys': ['subjective_swim', 'swim']}
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
    """Returns number of days between date_str and today."""
    if not date_str: return 9999
    try:
        d = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
        delta = datetime.date.today() - d
        return delta.days
    except ValueError:
        return 9999

def calculate_slope(values):
    """
    Calculates the slope of the linear regression line.
    values: list of float
    Returns: slope (float) or 0
    """
    n = len(values)
    if n < 2: return 0
    
    x = list(range(n)) # [0, 1, 2, ... n-1]
    y = values
    
    mean_x = mean(x)
    mean_y = mean(y)
    
    numerator = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y))
    denominator = sum((xi - mean_x) ** 2 for x in x)
    
    if denominator == 0: return 0
    return numerator / denominator

def get_trend_icon(slope, invert=False):
    """
    Returns a simple string identifier for the icon/direction.
    Matches js/views/metrics/utils.js logic roughly.
    """
    # Threshold for "flat"
    threshold = 0.001 
    
    if abs(slope) < threshold: return "Flat"
    
    is_up = slope > 0
    
    # If "invert" is True (e.g., Lower GCT is better), 
    # then an UP slope is "Worsening" (Red) and DOWN is "Improving" (Green).
    if invert:
        return "Rising" if is_up else "Falling"
    else:
        return "Rising" if is_up else "Falling"

def extract_metric_series(log, metric_key):
    """
    Extracts a list of valid values for a specific metric key, sorted by date.
    Returns: [{'date': 'YYYY-MM-DD', 'value': 123.4}, ...]
    """
    series = []
    
    # 1. Identify Sport Type Filter based on metric name
    # (Simple heuristic to avoid grabbing Bike power for Run metrics if keys overlap)
    target_sport = None
    if 'bike' in metric_key or 'cycling' in metric_key: target_sport = 'bike'
    elif 'run' in metric_key: target_sport = 'run'
    elif 'swim' in metric_key: target_sport = 'swim'
    
    for entry in log:
        if entry.get('exclude') is True: continue
        
        # Determine value (Handle derived metrics)
        val = None
        
        # Raw Data Check
        if metric_key in entry and entry[metric_key] is not None:
            val = safe_float(entry[metric_key])
            
        # Derived: Subjective Bike (Power / RPE)
        elif metric_key == 'subjective_bike':
            p = safe_float(entry.get('avgPower'))
            r = safe_float(entry.get('RPE'))
            if p and r and r > 0: val = p / r

        # Derived: Subjective Run (Speed / RPE)
        elif metric_key == 'subjective_run':
            s = safe_float(entry.get('averageSpeed'))
            r = safe_float(entry.get('RPE'))
            if s and r and r > 0: val = s / r

        # Derived: Endurance (Power / HR)
        elif metric_key == 'endurance':
            p = safe_float(entry.get('avgPower'))
            h = safe_float(entry.get('averageHR'))
            if p and h and h > 0: val = p / h

        # Derived: Mechanical (Vert / GCT * 100)
        elif metric_key == 'mechanical':
            v = safe_float(entry.get('avgVerticalOscillation'))
            g = safe_float(entry.get('avgGroundContactTime'))
            if v and g and g > 0: val = (v / g) * 100

        # Derived: Vert & GCT Mapping
        elif metric_key == 'vert': val = safe_float(entry.get('avgVerticalOscillation'))
        elif metric_key == 'gct': val = safe_float(entry.get('avgGroundContactTime'))
        elif metric_key == 'run': 
             # Run Efficiency (m/beat) = (Speed * 60) / HR
             s = safe_float(entry.get('averageSpeed'))
             h = safe_float(entry.get('averageHR'))
             if s and h and h > 0: val = (s * 60) / h
             
        elif metric_key == 'tss': val = safe_float(entry.get('trainingStressScore'))
        elif metric_key == 'vo2max': val = safe_float(entry.get('vO2MaxValue'))
        
        if val is not None:
             series.append({
                 'date': entry['date'], 
                 'days_ago': get_days_ago(entry['date']),
                 'value': val
             })
             
    # Sort by date (oldest first) for trend calculation
    series.sort(key=lambda x: x['date'])
    return series

def process_data():
    print("--- Generating Aggregated Coaching View ---")
    log = load_json(INPUT_LOG)
    config = load_json(INPUT_CONFIG)
    
    if not log or not config:
        print("Error: Missing input files.")
        return

    output_data = {
        "generated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "groups": []
    }

    # Iterate Groups
    for group in METRIC_GROUPS:
        group_data = {
            "name": group['name'],
            "metrics": []
        }
        
        for key in group['keys']:
            # Get Config Rule
            rule = config.get('metrics', {}).get(key, {})
            good_min = rule.get('good_min')
            good_max = rule.get('good_max')
            higher_is_better = rule.get('higher_is_better', True)
            
            # Extract Data
            series = extract_metric_series(log, key)
            if not series: continue

            # --- 1. Calculate Trends (30, 60, 90 days) ---
            trends = {}
            for days in [30, 60, 90]:
                # Get subset
                subset = [d['value'] for d in series if d['days_ago'] <= days]
                if len(subset) >= 2:
                    slope = calculate_slope(subset)
                    direction = get_trend_icon(slope, not higher_is_better)
                else:
                    direction = "Insufficient Data"
                trends[f"trend_{days}d"] = direction

            # --- 2. Calculate Current Status (Last 30 days Avg) ---
            recent_subset = [d['value'] for d in series if d['days_ago'] <= 30]
            
            status = "Unknown"
            avg_val = 0
            
            if recent_subset:
                avg_val = mean(recent_subset)
                
                # Check Logic
                if higher_is_better:
                    if good_min is not None and avg_val >= good_min: status = "On Target"
                    else: status = "Off Target"
                else: # Lower is better
                    if good_max is not None and avg_val <= good_max: status = "On Target"
                    else: status = "Off Target"
            else:
                status = "No Recent Data"

            # Append to Result
            group_data['metrics'].append({
                "key": key,
                "title": rule.get('title', key),
                "current_average": round(avg_val, 2),
                "status": status,
                "trends": trends,
                "target_info": f"{good_min} - {good_max}" if good_min or good_max else "N/A"
            })
            
        output_data['groups'].append(group_data)

    # Save
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2)
        
    print(f"Success! Saved aggregated view to: {OUTPUT_FILE}")

if __name__ == "__main__":
    process_data()
