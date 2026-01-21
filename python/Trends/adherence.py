import json
import pandas as pd
from datetime import datetime, timedelta
import os

# Configuration
INPUT_FILE = 'data/training_log.json'
OUTPUT_FILE = 'data/trends/adherence.json'

def load_data():
    with open(INPUT_FILE, 'r') as f:
        data = json.load(f)
    return pd.DataFrame(data)

def calculate_adherence(df, end_date, days, sport_filter=None):
    # Filter by date window (inclusive of end date)
    start_date = end_date - timedelta(days=days)
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
    
    # Cap Duration at 300%
    dur_pct = min(dur_pct, 300.0)

    # --- Count Calculation ---
    # Planned: Any non-rest with plannedDuration > 0
    # Completed: status='COMPLETED' OR actualDuration > 0
    
    planned_workouts = window_df[window_df['plannedDuration'] > 0].shape[0]
    
    # For completion, we trust the pre-calculated flag
    completed_workouts = window_df[window_df['is_completed']].shape[0]

    if planned_workouts > 0:
        count_pct = (completed_workouts / planned_workouts) * 100
    elif completed_workouts > 0:
        count_pct = 100.0
    else:
        count_pct = 0.0

    # Cap Count at 125%
    count_pct = min(count_pct, 125.0)

    return {
        "duration_pct": round(dur_pct),
        "count_pct": round(count_pct),
        "duration_label": f"{int(total_actual_mins)}m/{int(total_planned_mins)}m",
        "count_label": f"{completed_workouts}/{planned_workouts}"
    }

def main():
    if not os.path.exists(INPUT_FILE):
        print(f"Skipping Adherence: {INPUT_FILE} not found.")
        return

    df = load_data()
    
    # --- Preprocessing ---
    df['date'] = pd.to_datetime(df['date'])
    
    # Handle Sport Key: Prefer actualSport, fallback to type
    if 'actualSport' not in df.columns:
        df['actualSport'] = None 
    df['sport_key'] = df['actualSport'].fillna(df['type'])
    
    # Exclude Rest
    df = df[df['sport_key'] != 'Rest']
    
    # Ensure numerics
    df['plannedDuration'] = pd.to_numeric(df['plannedDuration'], errors='coerce').fillna(0)
    df['actualDuration'] = pd.to_numeric(df['actualDuration'], errors='coerce').fillna(0)

    # Determine Completion
    if 'status' not in df.columns:
        df['status'] = None
    df['is_completed'] = (df['status'] == 'COMPLETED') | (df['actualDuration'] > 0)
    
    # --- 1. Compliance Snapshot (Donuts) ---
    today = datetime.now().replace(hour=23, minute=59, second=59, microsecond=999)
    
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
    # weekday: Mon=0, Sat=5, Sun=6
    days_since_sat = (today.weekday() - 5) % 7
    last_saturday = today - timedelta(days=days_since_sat)
    last_saturday = last_saturday.replace(hour=23, minute=59, second=59)

    for i in range(52): # 52 weeks history
        anchor_date = last_saturday - timedelta(weeks=i)
        week_entry = {
            "week_ending": anchor_date.strftime('%Y-%m-%d'),
            "display_date": anchor_date.strftime('%m/%d')
        }
        
        for sport in sports:
            entry_data = {}
            for win_key, days in windows.items():
                entry_data[win_key] = calculate_adherence(df, anchor_date, days, sport)
            week_entry[sport] = entry_data
        
        rolling_data.append(week_entry)
    
    rolling_data.reverse() # Chronological order

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
