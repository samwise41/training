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

# Map "Sport" keys in JSON to Display Titles
SPORT_DISPLAY_MAP = {
    "All": "General Fitness",
    "Bike": "Cycling Metrics",
    "Run": "Running Metrics",
    "Swim": "Swimming Metrics"
}
GROUP_ORDER = ["All", "Bike", "Run", "Swim"]

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
    n = len(values)
    if n < 2: return 0, 0, 0
    
    x = list(range(n))
    y = values
    mean_x = mean(x)
    mean_y = mean(y)
    
    numerator = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y))
    denominator = sum((xi - mean_x) ** 2 for xi in x)
    
    if denominator == 0: return 0, mean_y, mean_y
    
    slope = numerator / denominator
    intercept = mean_y - (slope * mean_x)
    
    # Calculate start and end points of the regression line
    start_val = intercept + (slope * 0)
    end_val = intercept + (slope * (n - 1))
    
    return slope, start_val, end_val

def get_trend_label(slope):
    threshold = 0.0001
    if abs(slope) < threshold: return "Flat"
    return "Rising" if slope > 0 else "Falling"

def extract_metric_series(log, metric_key):
    series = []
    
    for entry in log:
        if entry.get('exclude') is True: continue
        
        p   = safe_float(entry.get('avgPower'))
        hr  = safe_float(entry.get('averageHR'))
        s   = safe_float(entry.get('averageSpeed'))
        rpe = safe_float(entry.get('RPE'))
        cad = safe_float(entry.get('averageBikingCadenceInRevPerMinute'))
        vert= safe_float(entry.get('avgVerticalOscillation'))
        gct = safe_float(entry.get('avgGroundContactTime'))
        
        val = None

        if metric_key == 'subjective_bike':
            if p and rpe and rpe > 0: val = p / rpe
        elif metric_key == 'endurance':
            if p and hr and hr > 0: val = p / hr
        elif metric_key == 'strength':
            if p and cad and cad > 0: val = p / cad
        elif metric_key == 'subjective_run':
            if s and rpe and rpe > 0: val = s / rpe
        elif metric_key == 'run': 
            if s and hr and hr > 0: val = (s * 60) / hr
        elif metric_key == 'mechanical':
            if vert and gct and gct > 0: val = (vert / gct) * 100
        elif metric_key == 'vert': val = vert
        elif metric_key == 'gct': val = gct
        elif metric_key == 'subjective_swim':
            if s and rpe and rpe > 0: val = s / rpe
        elif metric_key == 'swim':
            if s and hr and hr > 0: val = (s * 60) / hr
        elif metric_key == 'vo2max': val = safe_float(entry.get('vO2MaxValue'))
        elif metric_key == 'tss': val = safe_float(entry.get('trainingStressScore'))
        elif metric_key == 'calories': val = safe_float(entry.get('calories'))
        elif metric_key == 'anaerobic': val = safe_float(entry.get('anaerobicTrainingEffect'))
        elif metric_key == 'feeling_load': val = safe_float(entry.get('Feeling'))
        elif metric_key in entry:
            val = safe_float(entry[metric_key])

        if val is not None and val > 0:
             series.append({
                 'date': entry['date'], 
                 'days_ago': get_days_ago(entry['date']),
                 'value': val
             })
             
    series.sort(key=lambda x: x['date'])
    return series

def process_data():
    print("--- Generating Full Context Coaching View ---")
    log = load_json(INPUT_LOG)
    config = load_json(INPUT_CONFIG)
    
    if not log or not config:
        print("Error: Missing input files.")
        return

    grouped_metrics = {k: [] for k in GROUP_ORDER}
    metrics_config = config.get('metrics', {})
    
    for key, rule in metrics_config.items():
        sport = rule.get('sport', 'All')
        if sport not in grouped_metrics: sport = 'All'
            
        series = extract_metric_series(log, key)
        recent = [x['value'] for x in series if x['days_ago'] <= 30] if series else []
        current_avg = mean(recent) if recent else 0
        
        good_min = rule.get('good_min')
        good_max = rule.get('good_max')
        higher_is_better = rule.get('higher_is_better', True)
        
        status = "No Data"
        if recent:
            status = "Neutral"
            if higher_is_better:
                if good_min is not None and current_avg >= good_min: status = "On Target"
                elif good_min is not None: status = "Off Target"
            else:
                if good_max is not None and current_avg <= good_max: status = "On Target"
                elif good_max is not None: status = "Off Target"

        # Calculate Trends & Regression Lines
        trends = {}
        for period in [30, 60, 90]:
            if series:
                subset = [x['value'] for x in series if x['days_ago'] <= period]
                slope, start_val, end_val = calculate_slope(subset)
                
                trends[f"{period}d"] = {
                    "direction": get_trend_label(slope),
                    "slope": slope,
                    "start_val": start_val,
                    "end_val": end_val
                }
            else:
                trends[f"{period}d"] = {"direction": "Flat", "slope": 0, "start_val": 0, "end_val": 0}

        # Build Mega Object (Merging Config + Data)
        metric_obj = rule.copy()
        metric_obj.update({
            "id": key,
            "current_value": round(current_avg, 2) if recent else None,
            "status": status,
            "trends": trends,
            "has_data": bool(recent)
        })
        
        grouped_metrics[sport].append(metric_obj)

    output_data = {
        "generated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "metrics_summary": []
    }

    for sport_key in GROUP_ORDER:
        metrics_list = grouped_metrics.get(sport_key, [])
        if metrics_list:
            output_data['metrics_summary'].append({
                "group": SPORT_DISPLAY_MAP.get(sport_key, sport_key),
                "metrics": metrics_list
            })

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2)
        
    print(f"Success! Saved full context view to: {OUTPUT_FILE}")

if __name__ == "__main__":
    process_data()
