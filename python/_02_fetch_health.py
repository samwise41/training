import os
import sys
import json
import time
from datetime import date, timedelta
from garminconnect import Garmin

# --- CONFIGURATION ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
# Changed to JSON
OUTPUT_FILE = os.path.join(ROOT_DIR, 'garmin_data', 'garmin_health.json') 

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
    Automatically extracts all useful scalar metrics from the daily summary.
    """
    row = {}
    if not summary: return row
    
    # 1. Standardize Date
    if 'calendarDate' in summary:
        row['Date'] = summary['calendarDate']
    
    # 2. Calculated Conversions
    if 'sleepingSeconds' in summary and summary['sleepingSeconds']:
        row['Sleep Hours'] = round(summary['sleepingSeconds'] / 3600, 1)
    
    # 3. Dynamic Extraction
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

    # 4. Fallback for Body Battery
    if 'Body Batt Max' not in row and 'maxBodyBattery' in summary:
        row['Body Batt Max'] = summary['maxBodyBattery']
    
    return row

def fetch_weight(client, date_str):
    """
    Fetches weight for a specific day.
    """
    try:
        data = client.get_body_composition(date_str)
        if data and 'totalAverage' in data and data['totalAverage']:
            weight_g = data['totalAverage'].get('weight')
            if weight_g:
                # Convert Grams to Lbs
                return round(weight_g * 0.00220462, 1)
    except Exception:
        return None
    return None

def fetch_daily_stats(client, start_date, end_date):
    days = (end_date - start_date).days + 1
    print(f"📡 Fetching {days} days of data ({start_date} to {end_date})...")
    
    all_data = []

    # Fetch chronologically to be safe
    for i in range(days):
        current_date = start_date + timedelta(days=i)
        date_str = current_date.isoformat()
        
        try:
            # 1. Fetch Summary
            summary = client.get_user_summary(date_str)
            row = flatten_health_data(summary)

            # 2. Fetch Weight (Separate API Call)
            weight = fetch_weight(client, date_str)
            if weight:
                row['Weight (lbs)'] = weight

            if row:
                rhr = row.get('Resting HR', '--')
                sleep = row.get('Sleep Hours', '--')
                print(f"   ✅ {date_str}: RHR {rhr} | Sleep {sleep}h")
                all_data.append(row)
            else:
                print(f"   ⚠️ {date_str}: No data.")
                
        except Exception as e:
            print(f"   ❌ {date_str}: Error ({str(e)})")
        
        # Polite delay to avoid rate limiting
        time.sleep(0.5) 

    return all_data

# --- JSON MANAGEMENT ---

def load_existing_data():
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, ValueError):
            print("⚠️ Existing JSON file was corrupt. Starting fresh.")
            return []
    return []

def get_start_date(existing_data):
    """
    Determines the fetch start date based on existing history.
    """
    if not existing_data:
        # Initial Run: Go back 1 Year
        print("🆕 No existing history found. Fetching last 365 days.")
        return date.today() - timedelta(days=365)
    
    # Find the latest date in the file
    try:
        dates = [d.get('Date') for d in existing_data if d.get('Date')]
        if not dates:
            return date.today() - timedelta(days=365)
            
        last_date_str = max(dates) # ISO strings sort correctly
        last_date = date.fromisoformat(last_date_str)
        
        # We start from the last date (inclusive) to capture updates/weight changes
        print(f"🔄 Resuming from last recorded date: {last_date}")
        return last_date
    except Exception as e:
        print(f"⚠️ Error parsing dates: {e}. Defaulting to 1 year ago.")
        return date.today() - timedelta(days=365)

def save_json_data(new_data, existing_data):
    if not new_data:
        print("⚠️ No new data to save.")
        return

    # Create a map keyed by Date to merge/deduplicate
    # Start with existing data
    data_map = {item['Date']: item for item in existing_data if 'Date' in item}
    
    # Update with new data (overwriting matching dates)
    for item in new_data:
        if 'Date' in item:
            data_map[item['Date']] = item

    # Convert back to list and sort (Newest First)
    final_list = sorted(data_map.values(), key=lambda x: x['Date'], reverse=True)

    # Ensure directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    print(f"💾 Saving {len(final_list)} records to {OUTPUT_FILE}...")
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_list, f, indent=4)
        
    print("✅ Done.")

def main():
    client = init_garmin()
    
    # 1. Load History
    existing_data = load_existing_data()
    
    # 2. Determine Range
    today = date.today()
    start_date = get_start_date(existing_data)
    
    # 3. Fetch
    # Check if we are already up to date
    if start_date > today:
        print("✅ Data is already up to date.")
        return

    new_data = fetch_daily_stats(client, start_date, today)
    
    # 4. Save
    save_json_data(new_data, existing_data)

if __name__ == "__main__":
    main()
