import json
import os
import datetime
from statistics import mean

# --- PATH CONFIGURATION ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))

INPUT_LOG = os.path.join(PROJECT_ROOT, 'data', 'training_log.json')
INPUT_CONFIG = os.path.join(PROJECT_ROOT, 'data', 'metrics', 'metrics_config.json')
INPUT_DRIFT = os.path.join(PROJECT_ROOT, 'data', 'metrics', 'drift_history.json') 
OUTPUT_FILE = os.path.join(PROJECT_ROOT, 'data', 'metrics', 'coaching_view.json')

SPORT_DISPLAY_MAP = { "All": "General Fitness", "Bike": "Cycling Metrics", "Run": "Running Metrics", "Swim": "Swimming Metrics" }
GROUP_ORDER = ["All", "Bike", "Run", "Swim"]

def load_json(filepath):
    try:
        if not os.path.exists(filepath): return {} if 'config' in filepath else []
        with open(filepath, 'r', encoding='utf-8') as f: return json.load(f)
    except: return {}

def safe_float(val):
    try:
        if val is None: return None
        return float(val)
    except: return None

def get_days_ago(date_str):
    if not date_str: return 9999
    try:
        d = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
        return (datetime.date.today() - d).days
    except: return 9999

def calculate_slope(values):
    n = len(values)
    if n < 2: return 0
    x, y = list(range(n)), values
    mean_x, mean_y = mean(x), mean(y)
    num = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y))
    den = sum((xi - mean_x) ** 2 for xi, yi in zip(x, y))
    return num / den if den != 0 else 0

def get_trend_label(slope):
    if abs(slope) < 0.00001: return "Flat"
    return "Rising" if slope > 0 else "Falling"

def normalize_sport(entry):
    raw = entry.get('actualSport') or entry.get('sport') or 'Other'
    s = raw.lower()
    if 'cycl' in s or 'ride' in s or 'bike' in s: return 'Bike'
    if 'run' in s or 'jog' in s: return 'Run'
    if 'swim' in s or 'pool' in s: return 'Swim'
    return 'Other'

def extract_metric_series(log, metric_key, rules):
    series = []
    filters = rules.get('filters', {})
    target_sport = rules.get('sport', 'All')
    
    for entry in log:
        if entry.get('exclude') is True: continue
        
        entry_sport = normalize_sport(entry)
        if target_sport != 'All' and entry_sport != target_sport:
            continue
        
        dur_sec = safe_float(entry.get('durationInSeconds'))
        if dur_sec is None: dur_sec = safe_float(entry.get('duration')) or 0
        duration_min = dur_sec / 60.0
        
        if filters.get('min_duration_minutes') and duration_min < filters['min_duration_minutes']:
            continue

        p   = safe_float(entry.get('avgPower'))
        hr  = safe_float(entry.get('averageHR'))
        s   = safe_float(entry.get('averageSpeed'))
        rpe = safe_float(entry.get('RPE'))
        cad = safe_float(entry.get('averageBikingCadenceInRevPerMinute'))
        vert= safe_float(entry.get('avgVerticalOscillation'))
        gct = safe_float(entry.get('avgGroundContactTime'))
        
        val = None
        
        if filters.get('require_hr') and (not hr or hr <= 0): continue
        if filters.get('require_power') and (not p or p <= 0): continue

        if metric_key == 'subjective_bike': val = p / rpe if (p and rpe) else None
        elif metric_key == 'endurance': val = p / hr if (p and hr) else None
        elif metric_key == 'strength': val = p / cad if (p and cad) else None
        elif metric_key == 'subjective_run': val = s / rpe if (s and rpe) else None
        elif metric_key == 'run': val = (s * 60) / hr if (s and hr) else None
        elif metric_key == 'mechanical': val = (vert / gct) * 100 if (vert and gct) else None
        elif metric_key == 'vertical_ratio': val = safe_float(entry.get('avgVerticalRatio'))
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

        if val is None: continue
        if filters.get('ignore_zero') and val == 0: continue

        series.append({'date': entry['date'], 'days_ago': get_days_ago(entry['date']), 'value': val})
             
    series.sort(key=lambda x: x['date'])
    return series

def extract_drift_series(drift_data, sport_filter):
    series = []
    for entry in drift_data:
        if entry.get('sport') != sport_filter: continue
        val = safe_float(entry.get('val'))
        date = entry.get('date')
        if val is not None and date:
            series.append({
                'date': date,
                'days_ago': get_days_ago(date),
                'value': val
            })
    series.sort(key=lambda x: x['date'])
    return series

def process_data():
    print("--- Generating Coach View (3-Tier Status) ---")
    log = load_json(INPUT_LOG)
    config = load_json(INPUT_CONFIG)
    drift_history = load_json(INPUT_DRIFT)

    if not config: 
        print("❌ Config not found.")
        return

    grouped_metrics = {k: [] for k in GROUP_ORDER}
    
    for key, rule in config.get('metrics', {}).items():
        sport_group = rule.get('sport', 'All')
        if sport_group not in grouped_metrics: sport_group = 'All'
            
        if key == 'drift_bike':
            series = extract_drift_series(drift_history, 'Bike')
        elif key == 'drift_run':
            series = extract_drift_series(drift_history, 'Run')
        else:
            series = extract_metric_series(log, key, rule)

        recent_30 = [x['value'] for x in series if x['days_ago'] <= 30]
        current_avg = mean(recent_30) if recent_30 else 0
        
        good_min, good_max = rule.get('good_min'), rule.get('good_max')
        higher_is_better = rule.get('higher_is_better', True)
        
        # --- UPDATED STATUS LOGIC (Buffer of 5%) ---
        status = "No Data"
        buffer = 0.05

        if recent_30:
            status = "Neutral"
            
            if higher_is_better:
                if good_min is not None:
                    target = good_min
                    warning_threshold = target * (1.0 - buffer)
                    
                    if current_avg >= target:
                        status = "On Target"
                    elif current_avg >= warning_threshold:
                        status = "Warning"
                    else:
                        status = "Off Target"
            else:
                # Lower is better (e.g. Drift, Lower Ratio)
                if good_max is not None:
                    target = good_max
                    warning_threshold = target * (1.0 + buffer)
                    
                    if current_avg <= target:
                        status = "On Target"
                    elif current_avg <= warning_threshold:
                        status = "Warning"
                    else:
                        status = "Off Target"
        # ---------------------------------------------

        trends = {}
        for period, label in [(30, "30d"), (90, "90d"), (180, "6m"), (365, "1y")]:
            subset = [x['value'] for x in series if x['days_ago'] <= period] if series else []
            trends[label] = { 
                "direction": get_trend_label(calculate_slope(subset)) if len(subset) >= 2 else "Flat",
                "slope": calculate_slope(subset) if len(subset) >= 2 else 0
            }

        metric_obj = rule.copy()
        metric_obj.update({
            "id": key, "current_value": round(current_avg, 2) if recent_30 else None,
            "status": status, "trends": trends, "has_data": bool(recent_30)
        })
        grouped_metrics[sport_group].append(metric_obj)

    output = { "generated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "metrics_summary": [] }
    for k in GROUP_ORDER:
        if grouped_metrics[k]: output['metrics_summary'].append({ "group": SPORT_DISPLAY_MAP.get(k, k), "metrics": grouped_metrics[k] })

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f: json.dump(output, f, indent=2)
    print(f"Success! View saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    process_data()
