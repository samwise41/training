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

CACHE_DIR = os.path.join(PARENT_DIR, "power_cache")
BATCH_SIZE = 50 

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
    # 1. Validation
    if 'watts' not in streams or 'heartrate' not in streams:
        return None
    
    watts_data = streams['watts']['data']
    hr_data = streams['heartrate']['data']
    
    length = min(len(watts_data), len(hr_data))
    df = pd.DataFrame({'watts': watts_data[:length], 'hr': hr_data[:length]})
    
    # 2. Filter Bad Data (Keep coasting/0 watts, but remove bad HR)
    df_clean = df[df['hr'] > 40]
    
    # 3. Trim Logic (Remove 10m from Start and End)
    trim_seconds = 600 
    
    if len(df_clean) > (trim_seconds * 2 + 600):
        df_steady = df_clean.iloc[trim_seconds : -trim_seconds]
    else:
        return None # Too short to trim

    # 4. Split & Calc
    mid = len(df_steady) // 2
    first_half = df_steady.iloc[:mid]
    second_half = df_steady.iloc[mid:]

    ef1 = first_half['watts'].mean() / first_half['hr'].mean()
    ef2 = second_half['watts'].mean() / second_half['hr'].mean()
    
    if ef1 == 0: return None
    
    drift = (1 - (ef2 / ef1)) * 100
    return round(drift, 2)

def backfill():
    token = get_access_token()
    if not token: return

    headers = {'Authorization': f"Bearer {token}"}
    files = [f for f in os.listdir(CACHE_DIR) if f.endswith('.json')]
    print(f"🔍 Scanning {len(files)} files...")
    
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

        # Skip if already processed (even if null)
        if 'aerobic_decoupling' in data:
            skipped += 1
            continue
            
        aid = data.get('id')
        print(f"🔄 Processing {aid}...")
        
        try:
            url = f"https://www.strava.com/api/v3/activities/{aid}/streams"
            r = requests.get(url, headers=headers, params={'keys': 'watts,heartrate', 'key_by_type': 'true'})
            
            # --- HANDLE 404 (No Streams / Empty Data) ---
            if r.status_code == 404:
                print(f"   ⚠️ No streams found (404). Marking as null.")
                data['aerobic_decoupling'] = None
                with open(fpath, 'w') as f: json.dump(data, f)
                processed += 1
                continue
            # ---------------------------------------------
            
            if r.status_code == 429:
                print("⚠️ Rate Limit Hit. Stopping.")
                return
                
            if r.status_code != 200:
                print(f"   ⚠️ API Error {r.status_code}. Skipping.")
                continue
                
            streams = r.json()
            drift = calculate_decoupling_trimmed(streams)
            
            data['aerobic_decoupling'] = drift
            with open(fpath, 'w') as f: json.dump(data, f)
            
            if drift is None:
                print(f"   ⚠️ Data insufficient (Saved as null).")
            else:
                print(f"   ✅ Updated: {drift}%")
            
            updated += 1
            processed += 1
            time.sleep(1) 
            
        except Exception as e:
            print(f"   ❌ Error: {e}")

    print(f"\n🏁 Run Complete. Updated: {updated}. Skipped: {skipped}.")

if __name__ == "__main__":
    backfill()
