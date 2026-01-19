import json
import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# --- CONFIG ---
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FILE = os.path.join(REPO_ROOT, 'python', 'my_garmin_data_ALL.json')

# *** TARGET FILE: COACH_BRIEFING.md ***
OUTPUT_FILE = os.path.join(REPO_ROOT, 'COACH_BRIEFING.md')

# --- SPORT ID CONSTANTS ---
SPORT_IDS = {
    'RUN': [1],
    'BIKE': [2],
    'SWIM': [5, 26, 18] 
}

METRICS = {
    'aerobic_efficiency':    {'unit': 'EF', 'good': 'up', 'range': (1.3, 1.7)},
    'subjective_efficiency': {'unit': 'W/RPE', 'good': 'up', 'range': (25, 50)}, # NEW METRIC
    'torque_efficiency':     {'unit': 'W/RPM', 'good': 'up', 'range': (2.5, 3.5)},
    'run_economy':           {'unit': 'm/beat', 'good': 'up', 'range': (1.0, 1.6)},
    'run_stiffness':         {'unit': 'ratio', 'good': 'up', 'range': (0.75, 0.95)},
    'swim_efficiency':       {'unit': 'm/beat', 'good': 'up', 'range': (0.3, 0.6)},
    'ground_contact':        {'unit': 'ms', 'good': 'down', 'range': (220, 260)},
    'vertical_osc':          {'unit': 'cm', 'good': 'down', 'range': (6.0, 9.0)},
    'vo2_max':               {'unit': 'ml/kg', 'good': 'up', 'range': (45, 60)},
    'anaerobic_impact':      {'unit': 'TE', 'good': 'up', 'range': (2.0, 4.0)},
    'weekly_tss':            {'unit': 'TSS', 'good': 'up', 'range': (300, 600)}
}

def load_data():
    if not os.path.exists(DATA_FILE):
        print(f"Error: Data file not found at {DATA_FILE}")
        return pd.DataFrame()
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return pd.DataFrame(data)

def calculate_slope(series):
    if len(series) < 3: return 0.0
    y = series.values
    x = np.arange(len(y))
    slope = np.polyfit(x, y, 1)[0]
    return slope

def determine_trend(slope, good_direction):
    if abs(slope) < 0.001: return "➡️ Stable"
    is_up = slope > 0
    if good_direction == 'up':
        return "↗️ Improving" if is_up else "↘️ Declining"
    else: 
        return "↗️ Worsening" if is_up else "↘️ Improving"

def analyze_metric(df, col_name, config):
    now = datetime.now()
    results = {}
    
    if col_name == 'weekly_tss':
        if 'trainingStressScore' not in df.columns: return {'30d': 'No Data'}
        df_tss = df.dropna(subset=['trainingStressScore']).set_index('startTime_dt')
        weekly_series = df_tss['trainingStressScore'].resample('W-MON').sum()
        
        for days in [30, 90, 180]:
            cutoff = now - timedelta(days=days)
            subset = weekly_series[weekly_series.index >= cutoff]
            if len(subset) < 2:
                results[f'{days}d'] = "Not enough data"
                continue
            slope = calculate_slope(subset)
            trend_desc = determine_trend(slope, config['good'])
            avg_val = subset.mean()
            results[f'{days}d'] = f"{trend_desc} (Avg: {avg_val:.0f})"
            if days == 30: results['current'] = avg_val
        return results

    if col_name not in df.columns:
        return {'30d': 'No Data', '90d': 'No Data', '6m': 'No Data'}

    # Filter out zeros or NaNs for the specific metric
    df_clean = df.dropna(subset=[col_name]).sort_values('startTimeLocal')
    df_clean = df_clean[df_clean[col_name] > 0] # Ensure positive values
    
    for days in [30, 90, 180]:
        cutoff = now - timedelta(days=days)
        subset = df_clean[df_clean['startTime_dt'] >= cutoff]
        if len(subset) < 3:
            results[f'{days}d'] = "Not enough data"
            continue
        slope = calculate_slope(subset[col_name])
        trend_desc = determine_trend(slope, config['good'])
        avg_val = subset[col_name].mean()
        results[f'{days}d'] = f"{trend_desc} (Avg: {avg_val:.2f})"
        if days == 30: results['current'] = avg_val

    return results

def get_sport_filter(row, sport_type):
    act_type = row.get('activityType', {})
    if isinstance(act_type, str): return False # Handle edge cases where it's just a string key
    
    type_id = act_type.get('typeId')
    parent_id = act_type.get('parentTypeId')
    
    target_ids = SPORT_IDS.get(sport_type, [])
    if type_id in target_ids or parent_id in target_ids:
        return True
        
    key = act_type.get('typeKey', '').lower()
    parent_key = act_type.get('parentTypeKey', '').lower()
    
    if sport_type == 'RUN' and ('running' in key or 'running' in parent_key): return True
    if sport_type == 'BIKE' and ('cycling' in key or 'cycling' in parent_key): return True
    if sport_type == 'SWIM' and ('swimming' in key or 'swimming' in parent_key): return True
    
    return False

def main():
    print("Starting Trend Analysis...")
    df = load_data()
    
    if df.empty:
        print("DF Empty")
        return

    df['startTime_dt'] = pd.to_datetime(df['startTimeLocal'])
    
    is_run = df.apply(lambda x: get_sport_filter(x, 'RUN'), axis=1)
    is_bike = df.apply(lambda x: get_sport_filter(x, 'BIKE'), axis=1)
    is_swim = df.apply(lambda x: get_sport_filter(x, 'SWIM'), axis=1)

    # --- 1. Aerobic Efficiency (Physiological) ---
    # Power / Heart Rate
    df['aerobic_efficiency'] = np.where(
        is_bike & (df['avgPower'] > 0) & (df['averageHR'] > 0),
        df['avgPower'] / df['averageHR'], np.nan
    )

    # --- 2. Subjective Efficiency (Mental/Fatigue) ---
    # Power / RPE (Watts per unit of Perceived Exertion)
    # Note: Requires RPE to be 1-10. If 0, we treat as NaN to avoid div/0
    if 'perceivedEffort' in df.columns:
        df['rpe'] = pd.to_numeric(df['perceivedEffort'], errors='coerce')
        df['subjective_efficiency'] = np.where(
            is_bike & (df['avgPower'] > 0) & (df['rpe'] > 0),
            df['avgPower'] / df['rpe'], np.nan
        )
    else:
        df['subjective_efficiency'] = np.nan
    
    # --- 3. Torque Efficiency (Muscular) ---
    df['torque_efficiency'] = np.where(
        is_bike & (df['avgPower'] > 0) & (df['averageBikingCadenceInRevPerMinute'] > 0),
        df['avgPower'] / df['averageBikingCadenceInRevPerMinute'], np.nan
    )

    df['run_speed_m_min'] = df.get('averageSpeed', 0) * 60
    df['run_economy'] = np.where(
        is_run & (df.get('averageHR', 0) > 0),
        df['run_speed_m_min'] / df['averageHR'], np.nan
    )

    df['run_stiffness'] = np.where(
        is_run & (df.get('avgPower', 0) > 0),
        (df.get('averageSpeed', 0) * 100) / df['avgPower'], np.nan
    )

    df['swim_speed_m_min'] = df.get('averageSpeed', 0) * 60
    df['swim_efficiency'] = np.where(
        is_swim & (df.get('averageHR', 0) > 0),
        df['swim_speed_m_min'] / df['averageHR'], np.nan
    )

    df['ground_contact'] = df.get('avgGroundContactTime', np.nan)
    df['vertical_osc'] = df.get('avgVerticalOscillation', np.nan)
    df['vo2_max'] = df.get('vO2MaxValue', np.nan)
    df['anaerobic_impact'] = df.get('anaerobicTrainingEffect', np.nan)
    
    if 'trainingStressScore' not in df.columns:
        df['trainingStressScore'] = np.nan

    print(f"Writing briefing to: {OUTPUT_FILE}")
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write("# 🤖 AI Coach Context Briefing\n")
        f.write(f"**Last Updated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n")
        
        f.write("## 1. Physiological Trends\n")
        f.write("| Metric | Target | 30d Trend | 90d Trend | 6m Trend | Status |\n")
        f.write("| :--- | :--- | :--- | :--- | :--- | :--- |\n")

        alerts = []
        for key, conf in METRICS.items():
            stats = analyze_metric(df, key, conf)
            current = stats.get('current', 0)
            r_min, r_max = conf['range']
            
            status_icon = "✅"
            if current == 0:
                status_icon = "⚪ No Data"
            elif current < r_min: 
                status_icon = "⚠️ Low"
                if conf['good'] == 'up': alerts.append(f"**{key}** is {current:.2f} (Target: >{r_min}).")
            elif current > r_max: 
                status_icon = "⚠️ High"
                if conf['good'] == 'down': alerts.append(f"**{key}** is {current:.2f} (Target: <{r_max}).")
            
            unit = conf['unit']
            f.write(f"| **{key.replace('_', ' ').title()}** | {r_min}-{r_max} {unit} | {stats.get('30d', '--')} | {stats.get('90d', '--')} | {stats.get('6m', '--')} | {status_icon} |\n")

        f.write("\n## 2. Actionable Alerts\n")
        if alerts:
            for a in alerts: f.write(f"- {a}\n")
        else:
            f.write("- All systems Nominal.\n")
            
    print("Briefing generated successfully.")

if __name__ == "__main__":
    main()
