import os
import sys
import pandas as pd
from garminconnect import Garmin
from datetime import date, timedelta
import time

# --- CONFIGURATION ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
OUTPUT_FILE = os.path.join(ROOT_DIR, 'garmin_data', 'garmin_health.md')
DAYS_TO_FETCH = 15 

# --- CREDENTIALS ---
EMAIL = os.environ.get('GARMIN_EMAIL')
PASSWORD = os.environ.get('GARMIN_PASSWORD')

def init_garmin():
    if not EMAIL or not PASSWORD:
        print("❌ Error: Credentials missing.")
        sys.exit(1)
    try:
        print("🔐 Authenticating with Garmin Connect...")
        client = Garmin(EMAIL, PASSWORD)
        client.login()
        return client
    except Exception as e:
        print(f"❌ Login Failed: {e}")
        sys.exit(1)

# --- DYNAMIC DATA EXTRACTOR ---
def flatten_health_data(summary):
    """
    Automatically extracts all useful scalar metrics from the daily summary
    so we don't have to hardcode every single field name.
    """
    row = {}
    if not summary: return row
    
    # 1. Standardize Date
    if 'calendarDate' in summary:
        row['Date'] = summary['calendarDate']
    
    # 2. Calculated Conversions (Make these readable)
    if 'sleepingSeconds' in summary and summary['sleepingSeconds']:
        row['Sleep Hours'] = round(summary['sleepingSeconds'] / 3600, 1)
    
    # 3. Dynamic Extraction (The "Capture Everything" Logic)
    # We map ugly API keys to nice readable column headers
    field_map = {
        'restingHeartRate': 'Resting HR',
        'minHeartRate': 'Min HR',
        'maxHeartRate': 'Max HR',
        'averageStressLevel': 'Stress Avg',
        'maxStressLevel': 'Stress Max',
        'totalSteps': 'Steps',
        'totalDistanceMeters': 'Distance (m)',
        'floorsClimbed': 'Floors',
        'activeCalories': 'Active Cals',
        'bmrCalories': 'BMR Cals',
        'moderateIntensityMinutes': 'Mod Minutes',
        'vigorousIntensityMinutes': 'Vig Minutes',
        'bodyBatteryHighestValue': 'Body Batt Max',
        'bodyBatteryLowestValue': 'Body Batt Min',
        'sleepScore': 'Sleep Score',
        'hrvStatusBalanced': 'HRV Status'
    }

    for api_key, nice_name in field_map.items():
        if api_key in summary and summary[api_key] is not None:
            row[nice_name] = summary[api_key]

    # 4. Fallback: specific Fallback for Body Battery if 'HighestValue' key changes
    if 'Body Batt Max' not in row and 'maxBodyBattery' in summary:
        row['Body Batt Max'] = summary['maxBodyBattery']
    
    return row

def fetch_daily_stats(client, start_date, end_date):
    print(f"📡 Fetching Health Data from {start_date} to {end_date}...")
    
    days = (end_date - start_date).days + 1
    all_data = []

    for i in range(days):
        current_date = end_date - timedelta(days=i)
        date_str = current_date.isoformat()
        
        try:
            summary = client.get_user_summary(date_str)
            
            # --- USE DYNAMIC EXTRACTOR ---
            row = flatten_health_data(summary)
            # -----------------------------

            if row:
                # Log a few key stats to console just to show it's working
                rhr = row.get('Resting HR', '--')
                sleep = row.get('Sleep Hours', '--')
                print(f"   ✅ {date_str}: RHR {rhr} | Sleep {sleep}h")
                all_data.append(row)
            else:
                print(f"   ⚠️ {date_str}: No data.")
                
        except Exception as e:
            print(f"   ❌ {date_str}: Error ({str(e)})")
        
        time.sleep(0.5) 

    return all_data

def save_to_markdown(data):
    if not data:
        print("⚠️ No data to save.")
        return

    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Smart Column Sorting: Date first, then the rest
    cols = ['Date'] + [c for c in df.columns if c != 'Date']
    df = df[cols]

    # Ensure directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    print(f"💾 Saving {len(df)} records to {OUTPUT_FILE}...")
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write("# Garmin Health & Biometrics\n\n")
        f.write(f"**Last Updated:** {date.today().isoformat()}\n\n")
        f.write(df.to_markdown(index=False))
        
    print("✅ Done.")

def main():
    client = init_garmin()
    today = date.today()
    start_date = today - timedelta(days=DAYS_TO_FETCH)
    health_data = fetch_daily_stats(client, start_date, today)
    save_to_markdown(health_data)

if __name__ == "__main__":
    main()
