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
        v = float(val)
        if v == 0: return None 
        return v
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
    if n < 2: return 0
    x = list(range(n))
    y = values
    mean_x = mean(x)
    mean_y = mean(y)
    numerator = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y))
    denominator = sum((xi - mean_x) ** 2 for xi in x)
    if denominator == 0: return 0
    return numerator / denominator

def get_trend_label(slope):
    if abs(slope) < 0.00001: return "Flat"
    return "Rising" if slope > 0 else "Falling"

def extract_metric_series(log, metric_key):
    series = []
    for entry in log:
        if entry.get('exclude') is True: continue
        
        # Extract Raw Values
        p   = safe_float(entry.get('avgPower'))
        hr  = safe_float(entry.get('averageHR'))
        s   = safe_float(entry.get('averageSpeed'))
        rpe = safe_float(entry.get('RPE'))
        cad = safe_float(entry.get('averageBikingCadenceInRevPerMinute'))
        vert= safe_float(entry.get('avgVerticalOscillation'))
        gct = safe_float(entry.get('avgGroundContactTime'))
        
        val = None

        if metric_key == 'subjective_bike': val = p / rpe if (p and rpe) else None
        elif metric_key == 'endurance': val = p / hr if (p and hr) else None
        elif metric_key == 'strength': val = p / cad if (p and cad) else None
        elif metric_key == 'subjective_run': val = s / rpe if (s and rpe) else None
        elif metric_key == 'run': val = (s * 60) / hr if (s and hr) else None
        elif metric_key == 'mechanical': val = (vert / gct) * 100 if (vert and gct) else None
        elif metric_key == 'vert': val = vert
        elif metric_key == 'gct': val = gct
        elif metric_key == 'subjective_swim': val = s / rpe if (s and rpe) else None
        elif metric_key == 'swim': val = (s * 60) / hr if (s and hr) else None
        elif metric_key == 'vo2max': val = safe_float(entry.get('vO2MaxValue'))
        elif metric_key == 'tss': val = safe_float(entry.get('trainingStressScore'))
        elif metric_key == 'calories': val = safe_float(entry.get('calories'))
        elif metric_key == 'anaerobic': val = safe_float(entry.get('anaerobicTrainingEffect'))
        elif metric_key == 'feeling_load': val = safe_float(entry.get('Feeling'))
        elif metric_key in entry: val = safe_float(entry[metric_key])

        if val is not None:
             series.append({'date': entry['date'], 'days_ago': get_days_ago(entry['date']), 'value': val})
             
    series.sort(key=lambda x: x['date'])
    return series

def process_data():
    print("--- Generating Coherent Coaching View ---")
    log = load_json(INPUT_LOG)
    config = load_json(INPUT_CONFIG)
    
    if not log or not config:
        print("Error: Missing input files.")
        return

    metrics_config = config.get('metrics', {})
    grouped_metrics = {k: [] for k in GROUP_ORDER}
    
    for key, rule in metrics_config.items():
        sport = rule.get('sport', 'All')
        if sport not in grouped_metrics: sport = 'All'
            
        series = extract_metric_series(log, key)
        recent_30 = [x['value'] for x in series if x['days_ago'] <= 30]
        current_avg = mean(recent_30) if recent_30 else 0
        
        good_min = rule.get('good_min')
        good_max = rule.get('good_max')
        higher_is_better = rule.get('higher_is_better', True)
        
        status = "No Data"
        if recent_30:
            status = "Neutral"
            if higher_is_better:
                if good_min is not None and current_avg >= good_min: status = "On Target"
                elif good_min is not None: status = "Off Target"
            else:
                if good_max is not None and current_avg <= good_max: status = "On Target"
                elif good_max is not None: status = "Off Target"

        # Trends
        trends = {}
        # Keys here MUST match table.js expectations: "30d", "90d", "6m", "1y"
        periods = [(30, "30d"), (90, "90d"), (180, "6m"), (365, "1y")]
        
        for days, label in periods:
            if series:
                subset = [x['value'] for x in series if x['days_ago'] <= days]
                if len(subset) >= 2:
                    slope = calculate_slope(subset)
                    direction = get_trend_label(slope)
                else:
                    slope = 0
                    direction = "Flat"
                
                trends[label] = { "direction": direction, "slope": slope }
            else:
                trends[label] = { "direction": "Flat", "slope": 0 }

        metric_obj = rule.copy()
        metric_obj.update({
            "id": key,
            "current_value": round(current_avg, 2) if recent_30 else None,
            "status": status,
            "trends": trends, 
            "has_data": bool(recent_30)
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
        
    print(f"Success! Saved view to: {OUTPUT_FILE}")

if __name__ == "__main__":
    process_data()