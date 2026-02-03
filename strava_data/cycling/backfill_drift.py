import os
import json
import requests
import pandas as pd
import time
from dotenv import load_dotenv

# --- CONFIGURATION ---
# Get paths relative to this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(BASE_DIR)
load_dotenv(os.path.join(PARENT_DIR, '.env'))

CACHE_DIR = os.path.join(PARENT_DIR, "power_cache")
BATCH_SIZE = 50  # Safety limit: Process 50 rides per run to avoid API bans

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

def calculate_decoupling_trimmed(streams):
    """
    Calculates Aerobic Decoupling (Pw:Hr) with standard trimming.
    - Includes Zeros (Coasting) for Power
    - Filters Invalid HR (<40 bpm)
    - Trims first 10 mins and last 10 mins to remove warmup/cooldown
    """
    # 1. Validation
    if 'watts' not in streams or 'heartrate' not in streams:
        return None
    
    watts_data = streams['watts']['data']
    hr_data = streams['heartrate']['data']
    
    length = min(len(watts_data), len(hr_data))
    
    # Create DataFrame
    df = pd.DataFrame({
        'watts': watts_data[:length],
        'hr': hr_data[:length]
    })
    
    # 2. Filter Invalid Data (Keep coasting/0 watts, but remove bad HR)
    df_clean = df[df['hr'] > 40]
    
    # 3. Trim Logic (Standard: Remove 10m from Start and End)
    trim_seconds = 600 
    
    # Only calculate if ride is long enough (> 40 mins total roughly)
    # We need enough data remaining after trimming 20 mins total.
    if len(df_clean) > (trim_seconds * 2 + 600):
        df_steady = df_clean.iloc[trim_seconds : -trim_seconds]
    else:
        # Ride is too short for meaningful decoupling analysis
        return None

    # 4. Split Halves
    mid = len(df_steady) // 2
    first_half = df_steady.iloc[:mid]
    second_half = df_steady.iloc[mid:]

    # 5. Calculate Efficiency (Avg Power / Avg HR)
    # Using Average Power (standard Pw:Hr method)
    ef1 = first_half['watts'].mean() / first_half['hr'].mean()
    ef2 = second_half['watts'].mean() / second_half['hr'].mean()
    
    if ef1 == 0: return None
    
    # 6. Drift Calculation
    # Positive = Fatigue (HR rose or Power dropped)
    drift = (1 - (ef2 / ef1)) * 100
    
    return round(drift, 2)

def backfill():
    # 1. Setup
    token = get_access_token()
    if not token: return

    headers = {'Authorization': f"Bearer {token}"}
    
    if not os.path.exists(CACHE_DIR):
        print(f"❌ Cache directory not found: {CACHE_DIR}")
        return

    files = [f for f in os.listdir(CACHE_DIR) if f.endswith('.json')]
    print(f"🔍 Scanning {len(files)} files in cache...")
    
    processed = 0
    updated = 0
    skipped = 0
    
    # 2. Iterate Files
    for fname in files:
        if processed >= BATCH_SIZE:
            print(f"🛑 Batch limit of {BATCH_SIZE} reached. Run script again to continue.")
            break

        fpath = os.path.join(CACHE_DIR, fname)
        
        try:
            with open(fpath, 'r') as f:
                data = json.load(f)
        except:
            print(f"❌ Corrupt file, skipping: {fname}")
            continue

        # 3. Check if Update Needed
        # If the key exists, we don't need to do anything
        if 'aerobic_decoupling' in data:
            skipped += 1
            continue
            
        # 4. Fetch Missing Data
        aid = data.get('id')
        print(f"🔄 Fetching streams for {aid} ({data.get('name', 'Unknown')})...")
        
        try:
            # We explicitly request heartrate here
            url = f"https://www.strava.com/api/v3/activities/{aid}/streams"
            r = requests.get(url, headers=headers, params={'keys': 'watts,heartrate', 'key_by_type': 'true'})
            
            # API Safety
            if r.status_code == 429:
                print("⚠️ Rate Limit Hit. Stopping immediately.")
                return
            
            if r.status_code != 200:
                print(f"   ⚠️ API Error {r.status_code}. Skipping.")
                continue
                
            streams = r.json()
            
            # 5. Calculate & Save
            drift = calculate_decoupling_trimmed(streams)
            
            # Update the JSON object in memory
            data['aerobic_decoupling'] = drift
            
            # Write it back to disk
            with open(fpath, 'w') as f:
                json.dump(data, f)
            
            print(f"   ✅ Updated. Drift: {drift}%")
            updated += 1
            processed += 1
            
            # Be polite to the API
            time.sleep(1.5)
            
        except Exception as e:
            print(f"   ❌ Error: {e}")

    print(f"\n🏁 Backfill Complete.")
    print(f"   - Scanned: {len(files)}")
    print(f"   - Skipped (Already had data): {skipped}")
    print(f"   - Updated: {updated}")

if __name__ == "__main__":
    backfill()
