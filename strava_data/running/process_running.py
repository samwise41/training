import requests
import os
import pandas as pd
import json
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv

# --- PATH CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(BASE_DIR)
load_dotenv(os.path.join(PARENT_DIR, '.env'))

CACHE_DIR = os.path.join(PARENT_DIR, "running_cache")
OUTPUT_GRAPH = os.path.join(BASE_DIR, "running_pace_curve.json")
OUTPUT_MD = os.path.join(BASE_DIR, "my_running_prs.md")

MAX_DURATION_SECONDS = 14400 # 4 Hours
MAX_NEW_TO_PROCESS = 5
CONSECUTIVE_EXISTING_LIMIT = 50

# 1. TABLE CONFIGURATION (Distance Based - From Strava)
DISTANCES = [
    "400m", "1/2 mile", "1 mile", "2 mile", 
    "5k", "10k", "15k", "10 mile", "20k", 
    "Half-Marathon", "30k", "Marathon", "50k"
]

# Map Strava's labels to our clean table labels
STRAVA_NAMES = {
    "400m": "400m",
    "1/2 mile": "1/2 mile", "1/2 Mile": "1/2 mile",
    "1k": "1k", "1K": "1k",
    "1 mile": "1 mile", "1 Mile": "1 mile",
    "2 mile": "2 mile", "2 Mile": "2 mile",
    "5k": "5k", "5K": "5k",
    "10k": "10k", "10K": "10k",
    "15k": "15k", "15K": "15k",
    "10 mile": "10 mile", "10 Mile": "10 mile",
    "20k": "20k", "20K": "20k",
    "Half-Marathon": "Half-Marathon", "Half Marathon": "Half-Marathon",
    "30k": "30k", "30K": "30k",
    "Marathon": "Marathon",
    "50k": "50k", "50K": "50k"
}

def get_access_token():
    payload = {
        'client_id': os.getenv('STRAVA_CLIENT_ID'),
        'client_secret': os.getenv('STRAVA_CLIENT_SECRET'),
        'refresh_token': os.getenv('STRAVA_REFRESH_TOKEN'),
        'grant_type': 'refresh_token',
        'f': 'json'
    }
    try:
        res = requests.post("https://www.strava.com/oauth/token", data=payload, verify=True)
        res.raise_for_status()
        return res.json()['access_token']
    except Exception as e:
        print(f"⚠️ Auth Failed: {e}")
        return None

# Helper: Meters/Sec -> MM:SS/mi
def mps_to_pace(mps):
    if not mps or mps <= 0: return "--"
    mins_per_mile = 26.8224 / mps
    m = int(mins_per_mile)
    s = int((mins_per_mile - m) * 60)
    return f"{m}:{s:02d}/mi"

# Helper: Seconds -> HH:MM:SS
def format_time(seconds):
    m, s = divmod(seconds, 60)
    h, m = divmod(m, 60)
    if h > 0: return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"

# --- NEW: Calculate Running Drift (Pa:Hr) ---
def calculate_decoupling(streams):
    """
    Calculates Aerobic Decoupling for Running (Pace vs Heart Rate).
    Trims first/last 3 minutes (180s) to exclude warmup/cooldown.
    """
    # 1. Validation
    if 'velocity_smooth' not in streams or 'heartrate' not in streams:
        return None
    
    velocity_data = streams['velocity_smooth']['data']
    hr_data = streams['heartrate']['data']
    
    length = min(len(velocity_data), len(hr_data))
    
    # Create DataFrame
    df = pd.DataFrame({
        'speed': velocity_data[:length],
        'hr': hr_data[:length]
    })
    
    # 2. Clean Data
    # Remove stops (speed < 1 m/s ~ 26 min/mile) and bad HR
    df_active = df[(df['speed'] > 1.0) & (df['hr'] > 50)]
    
    # 3. Trim Logic (3 minutes from start AND end)
    trim_seconds = 180 
    
    # Require enough data to trim (at least 20 mins total duration recommended)
    # 3m + 3m + 10m (core) = 16 mins absolute minimum
    if len(df_active) > (trim_seconds * 2 + 600):
        df_steady = df_active.iloc[trim_seconds : -trim_seconds]
    else:
        # Fallback for short runs: skip calc
        return None

    # 4. Split into First and Second Half
    mid = len(df_steady) // 2
    first_half = df_steady.iloc[:mid]
    second_half = df_steady.iloc[mid:]

    # 5. Calculate Efficiency Factors (Avg Speed / Avg HR)
    # EF = Speed (m/s) / Heart Rate
    ef1 = first_half['speed'].mean() / first_half['hr'].mean()
    ef2 = second_half['speed'].mean() / second_half['hr'].mean()
    
    if ef1 == 0: return None

    # 6. Calculate Drift %
    # Positive = Fatigue (HR rose for same speed, or Speed dropped for same HR)
    drift = (1 - (ef2 / ef1)) * 100
    
    return round(drift, 2)

def update_cache(token):
    if not os.path.exists(CACHE_DIR): os.makedirs(CACHE_DIR)
    
    # 1. Check local cache
    cached_ids = set([int(f.split('.')[0]) for f in os.listdir(CACHE_DIR) if f.endswith('.json')])
    print(f"📂 Local Cache: Found {len(cached_ids)} existing runs.")

    if not token:
        print("⚠️ No Token. Skipping Cache Update.")
        return

    headers = {'Authorization': f"Bearer {token}"}
    
    page = 1
    processed_count = 0
    consecutive_existing = 0

    print("🏃 Syncing recent runs from Strava...")
    
    while processed_count < MAX_NEW_TO_PROCESS:
        try:
            r = requests.get(
                "https://www.strava.com/api/v3/athlete/activities", 
                headers=headers, 
                params={'page': page, 'per_page': 50}
            )
            r.raise_for_status()
            activities = r.json()
        except Exception as e:
            print(f"❌ API Error on page {page}: {e}")
            break
            
        if not activities:
            print("✅ No more activities found.")
            break

        for act in activities:
            # FILTER: Only Runs
            if act['type'] != "Run":
                continue
            
            aid = act['id']

            # CHECK: Do we have it?
            if aid in cached_ids:
                consecutive_existing += 1
                if consecutive_existing >= CONSECUTIVE_EXISTING_LIMIT:
                    print("✅ Found 50 existing runs in a row. Sync complete.")
                    return
                continue
            
            # If we get here, it's a NEW run
            consecutive_existing = 0
            print(f"   🏃 Processing NEW run: {act['name']} ({act['start_date_local'][:10]})")

            try:
                # 1. Get Streams (Updated to fetch heartrate)
                url = f"https://www.strava.com/api/v3/activities/{aid}/streams"
                r_stream = requests.get(url, headers=headers, params={'keys': 'velocity_smooth,heartrate', 'key_by_type': 'true'})
                
                if r_stream.status_code == 429:
                    print(f"⚠️ Rate Limit Exceeded. Stopping.")
                    return

                streams = r_stream.json() if r_stream.status_code == 200 else {}

                # 2. Get Details (for Table Best Efforts)
                r_det = requests.get(f"https://www.strava.com/api/v3/activities/{aid}", headers=headers)
                details = r_det.json()

                # 3. Calculate Pace Curve (Duration Based)
                curve = []
                if 'velocity_smooth' in streams:
                    velocity_series = pd.Series(streams['velocity_smooth']['data'])
                    limit = min(len(velocity_series), MAX_DURATION_SECONDS)
                    # We only calculate every 1s
                    for seconds in range(1, limit + 1):
                        peak_mps = velocity_series.rolling(window=seconds).mean().max()
                        curve.append(peak_mps)

                # 4. Extract Best Efforts (Distance Based)
                efforts = []
                if 'best_efforts' in details:
                    for e in details['best_efforts']:
                        efforts.append({
                            'name': e['name'],
                            'elapsed_time': e['elapsed_time']
                        })

                # 5. Calculate Drift (Pa:Hr)
                drift_score = calculate_decoupling(streams)

                # 6. Save EVERYTHING
                data = {
                    'id': aid,
                    'name': details['name'],
                    'date': details['start_date_local'][:10],
                    'velocity_curve': curve, # For JSON Graph (Time)
                    'best_efforts': efforts,  # For MD Table (Distance)
                    'aerobic_decoupling': drift_score # New Metric
                }
                
                with open(os.path.join(CACHE_DIR, f"{aid}.json"), "w") as f:
                    json.dump(data, f)
                
                drift_msg = f" (Drift: {drift_score}%)" if drift_score is not None else ""
                print(f"      ✅ Saved{drift_msg}")
                
                processed_count += 1
                if processed_count >= MAX_NEW_TO_PROCESS:
                    print(f"🛑 Reached limit of {MAX_NEW_TO_PROCESS} new files. Stopping.")
                    return

            except Exception as e:
                print(f"❌ Error processing {aid}: {e}")

        page += 1
        time.sleep(1)

    print(f"💾 Sync finished. Processed {processed_count} new runs.")

def generate_stats():
    print("📊 Generating Running Profile...")
    if not os.path.exists(CACHE_DIR):
        print(f"⚠️ No cache directory found at {CACHE_DIR}")
        return

    files = [f for f in os.listdir(CACHE_DIR) if f.endswith('.json')]
    if len(files) == 0: print("⚠️ Warning: Cache is empty.")
    
    # Storage for Graph (Time based)
    graph_all_time = [None] * MAX_DURATION_SECONDS
    graph_six_week = [None] * MAX_DURATION_SECONDS
    
    # Storage for Table (Distance based)
    table_all_time = {}
    table_six_week = {}

    today = datetime.now()
    six_weeks_ago = today - timedelta(weeks=6)
    
    for fname in files:
        with open(os.path.join(CACHE_DIR, fname), "r") as f:
            try: run = json.load(f)
            except: continue
        
        try:
            run_date = datetime.strptime(run['date'], "%Y-%m-%d")
        except: continue

        is_recent = run_date >= six_weeks_ago
        
        # A. Process Curve (Time based) for JSON
        if 'velocity_curve' in run and run['velocity_curve']:
            for i, mps in enumerate(run['velocity_curve']):
                if i >= MAX_DURATION_SECONDS: break
                if mps is None: continue
                
                # Higher mps is better
                if graph_all_time[i] is None or mps > graph_all_time[i]:
                    graph_all_time[i] = mps
                if is_recent:
                    if graph_six_week[i] is None or mps > graph_six_week[i]:
                        graph_six_week[i] = mps

        # B. Process Best Efforts (Distance based) for Table
        if 'best_efforts' in run:
            for effort in run['best_efforts']:
                dist_key = STRAVA_NAMES.get(effort['name'])
                if not dist_key: continue
                
                entry = {
                    'time': effort['elapsed_time'], 
                    'date': run['date'], 
                    'name': run.get('name', 'Run'), 
                    'id': run['id']
                }

                # Lower time is better
                if dist_key not in table_all_time or entry['time'] < table_all_time[dist_key]['time']:
                    table_all_time[dist_key] = entry
                
                if is_recent:
                    if dist_key not in table_six_week or entry['time'] < table_six_week[dist_key]['time']:
                        table_six_week[dist_key] = entry

    # 1. OUTPUT MARKDOWN (Distance Table)
    with open(OUTPUT_MD, "w", encoding="utf-8") as f:
        f.write("# 🏃 My Best Efforts (Running)\n\n")
        f.write("| Distance | All Time Best | Date | 6 Week Best | Date |\n")
        f.write("|---|---|---|---|---|\n")
        
        for dist in DISTANCES:
            at = table_all_time.get(dist)
            sw = table_six_week.get(dist)
            
            def fmt_link(record):
                if not record: return "--"
                return f"[{record['date']}](https://www.strava.com/activities/{record['id']})"

            at_str = f"**{format_time(at['time'])}**" if at else "--"
            sw_str = f"{format_time(sw['time'])}" if sw else "--"
            
            f.write(f"| {dist} | {at_str} | {fmt_link(at)} | {sw_str} | {fmt_link(sw)} |\n")
    
    # 2. OUTPUT JSON (Time Graph)
    graph_data = []
    for i in range(MAX_DURATION_SECONDS):
        at_mps = graph_all_time[i]
        sw_mps = graph_six_week[i]
        
        if at_mps:
            graph_data.append({
                "seconds": i + 1,
                "all_time_mps": at_mps,
                "six_week_mps": sw_mps if sw_mps else 0
            })
            
    with open(OUTPUT_GRAPH, "w") as f:
        json.dump(graph_data, f)
    
    print(f"✅ Updated {OUTPUT_MD} (Table) and {OUTPUT_GRAPH} (Curve)")

if __name__ == "__main__":
    token = get_access_token()
    update_cache(token)
    generate_stats()
