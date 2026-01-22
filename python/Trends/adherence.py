import json
import pandas as pd
from datetime import datetime, timedelta
import os

# --- PATH SETUP ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR)) 
INPUT_FILE = os.path.join(PROJECT_ROOT, 'data', 'training_log.json')
OUTPUT_FILE = os.path.join(PROJECT_ROOT, 'data', 'trends', 'adherence.json')

def load_data():
    if not os.path.exists(INPUT_FILE):
        return pd.DataFrame()
    try:
        with open(INPUT_FILE, 'r') as f:
            data = json.load(f)
        if not data: 
            return pd.DataFrame()
        return pd.DataFrame(data)
    except Exception as e:
        print(f"⚠️ Error loading JSON: {e}")
        return pd.DataFrame()

def calculate_adherence(df, end_date, days, sport_filter=None):
    # Logic: Look back 'days' amount of time from the 'end_date'
    # This creates the "Rolling Window" effect for trend lines.
    start_date = end_date - timedelta(days=days)
    
    # Filter data to strictly this window
    mask = (df['date'] > start_date) & (df['date'] <= end_date)
    window_df = df.loc[mask].copy()

    if sport_filter and sport_filter != 'All':
        window_df = window_df[window_df['sport_key'] == sport_filter]

    # --- Duration Calculation ---
    total_planned_mins = window_df['plannedDuration'].sum()
    total_actual_mins = window_df['actualDuration'].sum()

    if total_planned_mins > 0:
        dur_pct = (total_actual_mins / total_planned_mins) * 100
    elif total_actual_mins > 0:
        dur_pct = 100.0  # Zero plan but actual work done
    else:
        dur_pct = 0.0
    
    dur_pct = min(dur_pct, 300.0) # Cap at 300%

    # --- Count Calculation ---
    planned_workouts = window_df[window_df['plannedDuration'] > 0].shape[0]
    completed_workouts = window_df[window_df['is_completed']].shape[0]

    if planned_workouts > 0:
        count_pct = (completed_workouts / planned_workouts) * 100
    elif completed_workouts > 0:
        count_pct = 100.0
    else:
        count_pct = 0.0

    count_pct = min(count_pct, 125.0) # Cap at 125%

    # --- Formatting ---
    # Convert minutes to hours for display (e.g. "5.5h / 6.0h")
    plan_hours = total_planned_mins / 60
    act_hours = total_actual_mins / 60

    return {
        "duration_pct": round(dur_pct),
        "count_pct": round(count_pct),
        "duration_label": f"{act_hours:.1f}h / {plan_hours:.1f}h",
        "count_label": f"{completed_workouts}/{planned_workouts}"
    }

def main():
    print(f"🚀 Generating Adherence Report...")
    df = load_data()
    
    if df.empty:
        print(f"⚠️ No training log data found (or file is empty) at {INPUT_FILE}")
        return

    # --- Preprocessing ---
    # 1. Ensure columns exist
    required_cols = ['date', 'type', 'actualSport', 'plannedDuration', 'actualDuration', 'status']
    for col in required_cols:
        if col not in df.columns:
            df[col] = None 

    # 2. Fix Dates
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    df = df.dropna(subset=['date']) 

    # 3. Handle Sport Key
    if 'actualSport' not in df.columns:
        df['actualSport'] = None
    df['sport_key'] = df['actualSport'].fillna(df['type'])
    df['sport_key'] = df['sport_key'].fillna("Unknown")

    # 4. Exclude Rest
    df = df[df['sport_key'] != 'Rest']
    
    # 5. Numerics
    df['plannedDuration'] = pd.to_numeric(df['plannedDuration'], errors='coerce').fillna(0)
    df['actualDuration'] = pd.to_numeric(df['actualDuration'], errors='coerce').fillna(0)

    # 6. Completion Flag
    df['is_completed'] = (df['status'] == 'COMPLETED') | (df['actualDuration'] > 0)
    
    # --- 1. Compliance Snapshot (Donuts) ---
    today = datetime.now()
    today = today.replace(hour=23, minute=59, second=59, microsecond=999)
    
    windows = {
        '7d': 7, '30d': 30, '60d': 60, '90d': 90, '6m': 180, '1y': 365
    }
    sports = ['All', 'Bike', 'Run', 'Swim']

    compliance_data = {}
    for sport in sports:
        compliance_data[sport] = {}
        for win_key, days in windows.items():
            compliance_data[sport][win_key] = calculate_adherence(df, today, days, sport)

    # --- 2. Rolling Trends (Line Charts) ---
    rolling_data = []
    
    # Align to Saturdays
    days_since_sat = (today.weekday() - 5) % 7
    last_saturday = today - timedelta(days=days_since_sat)
    last_saturday = last_saturday.replace(hour=23, minute=59, second=59)

    # Generate 52 historic data points (weeks)
    for i in range(52): 
        anchor_date = last_saturday - timedelta(weeks=i)
        
        week_entry = {
            "week_ending": anchor_date.strftime('%Y-%m-%d'),
            "display_date": anchor_date.strftime('%m/%d')
        }
        
        # For EACH historic week, calculate what the compliance was 
        # looking back 7d, 30d, 60d from THAT date.
        for sport in sports:
            entry_data = {}
            for win_key, days in windows.items():
                entry_data[win_key] = calculate_adherence(df, anchor_date, days, sport)
            week_entry[sport] = entry_data
        
        rolling_data.append(week_entry)
    
    rolling_data.reverse() # Sort Oldest -> Newest for Graphing

    output = {
        "updated_at": datetime.utcnow().isoformat(),
        "compliance": compliance_data,
        "rolling_trends": rolling_data
    }

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(output, f, indent=2)
    print(f"✅ Adherence JSON generated at {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
