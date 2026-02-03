import os
import json
import requests
import pandas as pd
import time
from dotenv import load_dotenv

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(BASE_DIR)
load_dotenv(os.path.join(PARENT_DIR, '.env'))

CACHE_DIR = os.path.join(PARENT_DIR, "running_cache")
BATCH_SIZE = 50  # Process 50 runs per batch to be safe

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

def calculate_decoupling_running(streams):
    """
    Calculates Aerobic Decoupling for Running (Pace vs HR).
    Trims first/last 3 minutes (180s).
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
    
    # 2. Clean Data (Remove stops < 1m/s and bad HR)
    df_active = df[(df['speed'] > 1.0) & (df['hr'] > 50)]
    
    # 3. Trim Logic (3 minutes from start AND end)
    trim_seconds = 180 
    
    # Require enough data to trim (active duration > 16 mins)
    if len(df_active) > (trim_seconds * 2 + 600):
        df_steady = df_active.iloc[trim_seconds : -trim_seconds]
    else:
        return None

    # 4. Split Halves
    mid = len(df_steady) // 2
    first_half = df_steady.iloc[:mid]
    second_half = df_steady.iloc[mid:]

    # 5. Calculate Efficiency (Avg Speed / Avg HR)
    ef1 = first_half['speed'].mean() / first_half['hr'].mean()
    ef2 = second_half['speed'].mean() / second_half['hr'].mean()
    
    if ef1 == 0: return None
    
    # 6. Calculate Drift %
    drift = (1 - (ef2 / ef1)) * 100
    
    return round(drift, 2)

def backfill():
    token = get_access_token()
    if not token: return

    headers = {'Authorization': f"Bearer {token}"}
    
    if not os.path.exists(CACHE_DIR):
        print(f"❌ Cache directory not found: {CACHE_DIR}")
        return

    files = [f for f in os.listdir(CACHE_DIR) if f.endswith('.json')]
    print(f"🔍 Scanning {len(files)} files in running_cache...")
    
    processed = 0
    updated = 0
    skipped = 0
    
    for fname in files:
        if processed >= BATCH_SIZE:
            print(f"🛑 Batch limit of {BATCH_SIZE} reached. Run again to continue.")
            break

        fpath = os.path.join(CACHE_DIR, fname)
        
        try:
            with open(fpath, 'r') as f:
                data = json.load(f)
        except:
            continue

        # Skip if already processed
        if 'aerobic_decoupling' in data:
            skipped += 1
            continue
            
        aid = data.get('id')
        print(f"🔄 Processing {aid} ({data.get('name', 'Run')})...")
        
        try:
            url = f"https://www.strava.com/api/v3/activities/{aid}/streams"
            r = requests.get(url, headers=headers, params={'keys': 'velocity_smooth,heartrate', 'key_by_type': 'true'})
            
            # Handle 404 (Deleted/Private)
            if r.status_code == 404:
                print(f"   ⚠️ Activity not found (404). Marking as null.")
                data['aerobic_decoupling'] = None
                with open(fpath, 'w') as f: json.dump(data, f)
                processed += 1
                continue

            # Handle Rate Limit
            if r.status_code == 429:
                print("⚠️ Rate Limit Hit. Stopping.")
                return

            if r.status_code != 200:
                print(f"   ⚠️ API Error {r.status_code}. Skipping.")
                continue
                
            streams = r.json()
            drift = calculate_decoupling_running(streams)
            
            data['aerobic_decoupling'] = drift
            
            with open(fpath, 'w') as f:
                json.dump(data, f)
            
            if drift is None:
                print(f"   ⚠️ Data insufficient (Saved as null).")
            else:
                print(f"   ✅ Updated: {drift}%")
            
            updated += 1
            processed += 1
            time.sleep(1.5) # Polite pause
            
        except Exception as e:
            print(f"   ❌ Error: {e}")

    print(f"\n🏁 Run Complete. Updated: {updated}. Skipped: {skipped}.")

if __name__ == "__main__":
    backfill()
