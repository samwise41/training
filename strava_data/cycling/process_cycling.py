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

CACHE_DIR = os.path.join(PARENT_DIR, "power_cache")
OUTPUT_GRAPH = os.path.join(BASE_DIR, "power_curve_graph.json")
OUTPUT_MD = os.path.join(BASE_DIR, "my_power_profile.md")

MAX_DURATION_SECONDS = 21600 

# --- BACKFILL SETTINGS ---
MAX_NEW_TO_PROCESS = 10  
CONSECUTIVE_EXISTING_LIMIT = 10

KEY_INTERVALS = [
    ("1s", 1), ("5s", 5), ("15s", 15), ("30s", 30),
    ("1min", 60), ("2min", 120), ("5min", 300),
    ("10min", 600), ("20min", 1200), ("30min", 1800), 
    ("1hr", 3600), ("2hr", 7200), ("3hr", 10800), 
    ("4hr", 14400), ("5hr", 18000), ("6hr", 21600)
]

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

def format_duration(seconds):
    h, r = divmod(seconds, 3600)
    m, s = divmod(r, 60)
    parts = []
    if h > 0: parts.append(f"{h}h")
    if m > 0: parts.append(f"{m}m")
    if s > 0 or not parts: parts.append(f"{s}s")
    return " ".join(parts)

def update_cache(token):
    if not os.path.exists(CACHE_DIR): os.makedirs(CACHE_DIR)
    
    # 1. Check what we already have
    cached_ids = set([int(f.split('.')[0]) for f in os.listdir(CACHE_DIR) if f.endswith('.json')])
    print(f"📂 Local Cache: Found {len(cached_ids)} existing rides.")

    if not token:
        print("⚠️ No Token. Skipping Cache Update.")
        return

    headers = {'Authorization': f"Bearer {token}"}
    
    page = 1
    processed_count = 0
    consecutive_existing = 0

    print("📡 Syncing recent rides from Strava...")
    
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
            if act['type'] not in ['Ride', 'VirtualRide']:
                continue
            
            aid = act['id']

            if aid in cached_ids:
                consecutive_existing += 1
                if consecutive_existing >= CONSECUTIVE_EXISTING_LIMIT:
                    print(f"✅ Found {CONSECUTIVE_EXISTING_LIMIT} existing rides in a row. Sync complete.")
                    return
                continue
            
            consecutive_existing = 0 
            print(f"   🚴 Processing NEW ride: {act['name']} ({act['start_date_local'][:10]})")

            try:
                url = f"https://www.strava.com/api/v3/activities/{aid}/streams"
                r_stream = requests.get(url, headers=headers, params={'keys': 'watts', 'key_by_type': 'true'})
                
                if r_stream.status_code == 429: 
                    print("⚠️ Rate Limit Hit. Stopping.")
                    return
                
                streams = r_stream.json() if r_stream.status_code == 200 else {}
                
                if 'watts' not in streams:
                    with open(os.path.join(CACHE_DIR, f"{aid}.json"), "w") as f:
                        json.dump({'id': aid, 'no_power': True, 'name': act['name'], 'date': act['start_date_local'][:10]}, f)
                    processed_count += 1
                    continue

                r_det = requests.get(f"https://www.strava.com/api/v3/activities/{aid}", headers=headers)
                details = r_det.json()

                power_series = pd.Series(streams['watts']['data'])
                limit = min(len(power_series), MAX_DURATION_SECONDS)
                curve = []
                for seconds in range(1, limit + 1):
                    peak = int(power_series.rolling(window=seconds).mean().max())
                    curve.append(peak)

                data = {
                    'id': aid,
                    'name': details['name'],
                    'date': details['start_date_local'][:10],
                    'power_curve': curve
                }
                with open(os.path.join(CACHE_DIR, f"{aid}.json"), "w") as f:
                    json.dump(data, f)
                
                processed_count += 1
                if processed_count >= MAX_NEW_TO_PROCESS:
                    print(f"🛑 Reached limit of {MAX_NEW_TO_PROCESS} new files. Stopping.")
                    return

            except Exception as e:
                print(f"❌ Error processing {aid}: {e}")

        page += 1
        time.sleep(1)

    print(f"💾 Sync finished. Processed {processed_count} new rides.")

def generate_stats():
    print("📊 Generating Power Profile from Cache...")
    if not os.path.exists(CACHE_DIR):
        print(f"⚠️ No cache directory found at {CACHE_DIR}")
        return

    files = [f for f in os.listdir(CACHE_DIR) if f.endswith('.json')]
    if len(files) == 0: print("⚠️ Warning: Cache is empty.")
    
    all_time_best = [None] * MAX_DURATION_SECONDS
    six_week_best = [None] * MAX_DURATION_SECONDS
    
    today = datetime.now()
    six_weeks_ago = today - timedelta(weeks=6)
    
    for fname in files:
        with open(os.path.join(CACHE_DIR, fname), "r") as f:
            try: ride = json.load(f)
            except: continue
        
        if 'power_curve' not in ride: continue
        
        try: ride_date = datetime.strptime(ride['date'], "%Y-%m-%d")
        except: continue

        is_recent = ride_date >= six_weeks_ago
        curve = ride['power_curve']
        
        for i, watts in enumerate(curve):
            if i >= MAX_DURATION_SECONDS: break
            
            entry = {'watts': watts, 'date': ride['date'], 'name': ride.get('name', 'Ride'), 'id': ride['id']}
            
            if all_time_best[i] is None or watts > all_time_best[i]['watts']:
                all_time_best[i] = entry
            
            if is_recent:
                if six_week_best[i] is None or watts > six_week_best[i]['watts']:
                    six_week_best[i] = entry

    # MARKDOWN
    with open(OUTPUT_MD, "w", encoding="utf-8") as f:
        f.write("# ⚡ Power Profile (1s - 6h)\n\n")
        f.write("| Duration | All Time Best | Date | 6 Week Best | Date |\n")
        f.write("|---|---|---|---|---|\n")
        
        for label, seconds in KEY_INTERVALS:
            idx = seconds - 1
            if idx < len(all_time_best):
                at = all_time_best[idx]
                sw = six_week_best[idx]
                
                def fmt_link(record):
                    if not record: return "--"
                    return f"[{record['date']}](https://www.strava.com/activities/{record['id']})"

                at_val = f"**{at['watts']}w**" if at else "--"
                sw_val = f"{sw['watts']}w" if sw else "--"
                f.write(f"| {label} | {at_val} | {fmt_link(at)} | {sw_val} | {fmt_link(sw)} |\n")

    # GRAPH JSON - UPDATED TO INCLUDE METADATA
    graph_data = []
    for i in range(MAX_DURATION_SECONDS):
        at = all_time_best[i]
        sw = six_week_best[i]
        if at:
            item = {
                "seconds": i + 1,
                "all_time_watts": at['watts'],
                "at_date": at['date'],
                "at_id": at['id'],
                "six_week_watts": 0
            }
            if sw:
                item["six_week_watts"] = sw['watts']
                item["sw_date"] = sw['date']
                item["sw_id"] = sw['id']
            
            graph_data.append(item)
            
    with open(OUTPUT_GRAPH, "w") as f:
        json.dump(graph_data, f)
    
    print(f"✅ Updated {OUTPUT_MD} and {OUTPUT_GRAPH}")

if __name__ == "__main__":
    token = get_access_token()
    update_cache(token)
    generate_stats()
