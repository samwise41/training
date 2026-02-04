import os
import sys
import json
import time
from datetime import date, timedelta
from garminconnect import Garmin

# --- CONFIGURATION ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
OUTPUT_FILE = os.path.join(ROOT_DIR, 'garmin_data', 'garmin_health.json') 

# SET THIS TO TRUE TO SEE RAW DATA IN LOGS
DEBUG = True 

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

# --- DEBUG HELPER ---
def debug_log(title, data):
    if DEBUG and data:
        print(f"\n--- DEBUG: {title} ---")
        print(json.dumps(data, indent=2, default=str))
        print("------------------------\n")

# --- HELPER: FLATTEN HEALTH SUMMARY ---
def extract_health_metrics(summary):
    row = {}
    if not summary: return row
    
    # DEBUG: See what is in the daily summary
    debug_log("Daily Summary", summary)
    
    if 'calendarDate' in summary:
        row['Date'] = summary['calendarDate']
    
    if 'sleepingSeconds' in summary and summary['sleepingSeconds']:
        row['Sleep Hours'] = round(summary['sleepingSeconds'] / 3600, 1)
    
    field_map = {
        'restingHeartRate': 'Resting HR',
        'minHeartRate': 'Min HR',
        'maxHeartRate': 'Max HR',
        'averageStressLevel': 'Stress Avg',
        'maxStressLevel': 'Stress Max',
        'totalSteps': 'Steps',
        'bodyBatteryHighestValue': 'Body Batt Max',
        'bodyBatteryLowestValue': 'Body Batt Min',
        'sleepScore': 'Sleep Score',
        'hrvStatusBalanced': 'HRV Status'
    }

    for api_key, nice_name in field_map.items():
        if api_key in summary and summary[api_key] is not None:
            row[nice_name] = summary[api_key]

    # Fallback for Body Battery
    if 'Body Batt Max' not in row and 'maxBodyBattery' in summary:
        row['Body Batt Max'] = summary['maxBodyBattery']
    
    return row

# --- HELPER: FETCH PERFORMANCE METRICS (Activities) ---
def fetch_activity_metrics(client, date_str):
    metrics = {}
    try:
        activities = client.get_activities_by_date(date_str, date_str, "")
        if not activities: return metrics

        run_dist = 0
        run_time = 0
        run_cadence_sum = 0
        run_count = 0

        for act in activities:
            sport = act.get('activityType', {}).get('typeKey')
            
            # DEBUG: Show ONE Run Activity to see available fields
            if sport == 'running' and run_count == 0:
                debug_log("Sample Running Activity", act)

            if sport == 'running':
                dist = act.get('distance', 0) # meters
                dur = act.get('duration', 0)  # seconds
                
                avg_cadence = act.get('averageRunningCadenceInStepsPerMinute')
                if avg_cadence:
                    run_cadence_sum += (avg_cadence * dur)
                    run_count += 1
                
                run_dist += dist
                run_time += dur

        # Calculate Averages
        if run_dist > 0 and run_time > 0:
            avg_speed_mps = run_dist / run_time
            metrics['Run Avg Speed (m/s)'] = round(avg_speed_mps, 2)
            
        if run_time > 0 and run_cadence_sum > 0:
            metrics['Run Avg Cadence'] = round(run_cadence_sum / run_time)

    except Exception:
        pass 
    return metrics

# --- HELPER: FETCH PHYSIOLOGICAL METRICS (Max Metrics) ---
def fetch_max_metrics(client, date_str):
    metrics = {}
    try:
        # Use get_max_metrics specifically for VO2/Fitness Age
        max_metrics = client.get_max_metrics(date_str)
        
        if max_metrics:
            # DEBUG: See what get_max_metrics returns
            debug_log("Max Metrics", max_metrics)
            
            # Extract VO2 Max (Running)
            for item in max_metrics:
                if 'generic' in item and 'vo2MaxValue' in item['generic']:
                    metrics['VO2 Max'] = item['generic']['vo2MaxValue']
                
                # Check for Lactate Threshold if available in this endpoint
                # (Field names vary, check your logs!)
                if 'running' in item and 'lactateThresholdHeartRate' in item['running']:
                     metrics['Lactate Threshold HR'] = item['running']['lactateThresholdHeartRate']
                
    except Exception:
        pass
    return metrics

def fetch_weight(client, date_str):
    try:
        data = client.get_body_composition(date_str)
        if data and 'totalAverage' in data and data['totalAverage']:
            weight_g = data['totalAverage'].get('weight')
            if weight_g:
                return round(weight_g * 0.00220462, 1)
    except Exception:
        return None
    return None

def fetch_daily_stats(client, start_date, end_date):
    days = (end_date - start_date).days + 1
    print(f"📡 Fetching {days} days of data ({start_date} to {end_date})...")
    
    all_data = []
    
    # GLOBAL FLAG to only print debug info ONCE
    global DEBUG
    
    for i in range(days):
        current_date = start_date + timedelta(days=i)
        date_str = current_date.isoformat()
        
        row = {'Date': date_str}
        
        try:
            # 1. Health Summary
            summary = client.get_user_summary(date_str)
            row.update(extract_health_metrics(summary))

            # 2. Performance (Activities)
            row.update(fetch_activity_metrics(client, date_str))

            # 3. Physiology (New Endpoint)
            row.update(fetch_max_metrics(client, date_str))

            # 4. Weight
            weight = fetch_weight(client, date_str)
            if weight:
                row['Weight (lbs)'] = weight

            # Turn off debug after the first successful day
            if DEBUG and len(row) > 1:
                DEBUG = False 

            # Console Log
            rhr = row.get('Resting HR', '-')
            vo2 = row.get('VO2 Max', '-')
            run_cad = row.get('Run Avg Cadence', '-')
            
            print(f"   ✅ {date_str}: RHR {rhr} | VO2 {vo2} | Run Cad {run_cad}")
            
            if len(row) > 1:
                all_data.append(row)
            else:
                print(f"   ⚠️ {date_str}: No data.")
                
        except Exception as e:
            print(f"   ❌ {date_str}: Error ({str(e)})")
        
        time.sleep(1.0) 

    return all_data

# --- JSON MANAGEMENT ---

def load_existing_data():
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, ValueError):
            return []
    return []

def get_start_date(existing_data):
    if not existing_data:
        print("🆕 No existing history found. Fetching last 365 days.")
        return date.today() - timedelta(days=365)
    
    try:
        dates = [d.get('Date') for d in existing_data if d.get('Date')]
        if not dates:
            return date.today() - timedelta(days=365)
            
        last_date_str = max(dates)
        last_date = date.fromisoformat(last_date_str)
        
        print(f"🔄 Resuming from last recorded date: {last_date}")
        return last_date
    except Exception as e:
        print(f"⚠️ Error parsing dates: {e}. Defaulting to 1 year ago.")
        return date.today() - timedelta(days=365)

def save_json_data(new_data, existing_data):
    if not new_data:
        print("⚠️ No new data to save.")
        return

    data_map = {item['Date']: item for item in existing_data if 'Date' in item}
    
    for item in new_data:
        if 'Date' in item:
            if item['Date'] in data_map:
                data_map[item['Date']].update(item)
            else:
                data_map[item['Date']] = item

    final_list = sorted(data_map.values(), key=lambda x: x['Date'], reverse=True)

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    print(f"💾 Saving {len(final_list)} records to {OUTPUT_FILE}...")
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_list, f, indent=4)
        
    print("✅ Done.")

def main():
    client = init_garmin()
    existing_data = load_existing_data()
    
    today = date.today()
    start_date = get_start_date(existing_data)
    
    if start_date > today:
        print("✅ Data is already up to date.")
        # OPTIONAL: FORCE RUN FOR DEBUGGING
        # start_date = date.today() - timedelta(days=2) 
        return

    new_data = fetch_daily_stats(client, start_date, today)
    save_json_data(new_data, existing_data)

if __name__ == "__main__":
    main()
