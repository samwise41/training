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

# Debug: Set to True to see raw API JSON responses in logs
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
        if isinstance(data, list) and len(data) > 2:
            print(json.dumps(data[:2], indent=2, default=str))
            print(f"... ({len(data)-2} more items) ...")
        else:
            print(json.dumps(data, indent=2, default=str))
        print("------------------------\n")

# --- 1. BASE HEALTH SUMMARY ---
def extract_health_summary(client, date_str):
    row = {}
    try:
        summary = client.get_user_summary(date_str)
        if not summary: return row
        
        row['Date'] = date_str
        
        # Standard Fields
        field_map = {
            'restingHeartRate': 'Resting HR',
            'minHeartRate': 'Min HR',
            'maxHeartRate': 'Max HR',
            'averageStressLevel': 'Stress Avg',
            'maxStressLevel': 'Stress Max',
            'totalSteps': 'Steps',
            'totalDistanceMeters': 'Daily Distance (m)',
            'floorsClimbed': 'Floors',
            'activeCalories': 'Active Cals',
            'bodyBatteryHighestValue': 'Body Batt Max',
            'bodyBatteryLowestValue': 'Body Batt Min',
            'sleepScore': 'Sleep Score',
            'hrvStatusBalanced': 'HRV Status'
        }

        for api_key, nice_name in field_map.items():
            if api_key in summary and summary[api_key] is not None:
                row[nice_name] = summary[api_key]

        if 'sleepingSeconds' in summary and summary['sleepingSeconds']:
            row['Sleep Hours'] = round(summary['sleepingSeconds'] / 3600, 1)
            
    except Exception: pass
    return row

# --- 2. ADVANCED METRICS FETCHER ---
def fetch_advanced_metrics(client, date_str):
    metrics = {}
    
    # A. Readiness
    try:
        readiness = client.get_morning_training_readiness(date_str)
        if readiness and 'trainingReadinessScore' in readiness:
            metrics['Readiness Score'] = readiness['trainingReadinessScore']
    except Exception: pass

    # B. Training Status
    try:
        status = client.get_training_status(date_str)
        if status:
            latest = status[-1]
            if 'heatAdaptation' in latest: metrics['Heat Adaptation'] = latest['heatAdaptation']
            if 'altitudeAdaptation' in latest: metrics['Altitude Adaptation'] = latest['altitudeAdaptation']
            if 'load' in latest: metrics['Acute Load'] = latest['load']
    except Exception: pass

    # C. Respiration
    try:
        resp = client.get_respiration_data(date_str)
        if resp and 'avgWakingRespirationValue' in resp:
            metrics['Respiration Avg'] = resp['avgWakingRespirationValue']
    except Exception: pass

    # D. SpO2
    try:
        spo2 = client.get_spo2_data(date_str)
        if spo2 and 'averageSpO2' in spo2:
            metrics['SpO2 Avg'] = spo2['averageSpO2']
    except Exception: pass

    # E. HRV
    try:
        hrv = client.get_hrv_data(date_str)
        if hrv and 'hrvSummary' in hrv:
            metrics['HRV Night Avg'] = hrv['hrvSummary'].get('weeklyAverage')
            metrics['HRV Last Night'] = hrv['hrvSummary'].get('lastNightAverage')
    except Exception: pass

    # F. Fitness Age (Specific Endpoint)
    try:
        fit_age = client.get_fitnessage_data(date_str)
        # Check explicit keys or list structure
        if fit_age and isinstance(fit_age, dict):
            if 'fitnessAge' in fit_age:
                metrics['Fitness Age'] = fit_age['fitnessAge']
        elif fit_age and isinstance(fit_age, list) and len(fit_age) > 0:
             if 'fitnessAge' in fit_age[-1]:
                 metrics['Fitness Age'] = fit_age[-1]['fitnessAge']
    except Exception: pass

    # G. VO2 Max (Max Metrics)
    try:
        max_m = client.get_max_metrics(date_str)
        if max_m:
            for item in max_m:
                if 'generic' in item and 'vo2MaxValue' in item['generic']:
                    metrics['VO2 Max'] = item['generic']['vo2MaxValue']
    except Exception: pass

    # H. Intensity Minutes
    try:
        minutes = client.get_intensity_minutes_data(date_str)
        if minutes:
            metrics['Intensity Min Mod'] = minutes.get('dailyModerateIntensityMinutes', 0)
            metrics['Intensity Min Vig'] = minutes.get('dailyVigorousIntensityMinutes', 0)
    except Exception: pass

    # I. Blood Pressure (Robust Parsing)
    try:
        # Use start/end date range for robustness
        bp_data = client.get_blood_pressure(date_str, date_str)
        if bp_data and 'measurementSummaries' in bp_data:
            readings = []
            for summary in bp_data['measurementSummaries']:
                if 'measurements' in summary:
                    readings.extend(summary['measurements'])
            
            if readings:
                # Average all readings for the day
                sys_sum = sum(r['systolic'] for r in readings if 'systolic' in r)
                dia_sum = sum(r['diastolic'] for r in readings if 'diastolic' in r)
                count = len(readings)
                if count > 0:
                    metrics['BP Systolic'] = round(sys_sum / count)
                    metrics['BP Diastolic'] = round(dia_sum / count)
    except Exception: pass

    return metrics

# --- 3. ACTIVITY & PERFORMANCE ---
def fetch_activity_performance(client, date_str):
    metrics = {}
    try:
        activities = client.get_activities_by_date(date_str, date_str, "")
        if not activities: return metrics

        run_dist = 0
        run_time = 0
        
        for act in activities:
            sport = act.get('activityType', {}).get('typeKey')
            if sport == 'running':
                run_dist += act.get('distance', 0)
                run_time += act.get('duration', 0)
                cad = act.get('averageRunningCadenceInStepsPerMinute')
                if cad: metrics['Run Avg Cadence'] = cad

        if run_dist > 0 and run_time > 0:
            metrics['Run Avg Speed (m/s)'] = round(run_dist / run_time, 2)

    except Exception: pass
    return metrics

# --- 4. BODY COMPOSITION (Aggressive) ---
def fetch_body_comp(client, date_str):
    metrics = {}
    try:
        # Method A: Daily Weigh-Ins (Manual)
        weigh_ins = client.get_daily_weigh_ins(date_str)
        if weigh_ins and 'dateWeightList' in weigh_ins:
            valid_entries = [w for w in weigh_ins['dateWeightList'] if w['weight'] > 0]
            if valid_entries:
                latest = valid_entries[-1]
                # Grams to Lbs
                metrics['Weight (lbs)'] = round(latest['weight'] * 0.00220462, 1)
                
                # Check for fat/muscle if available
                if 'muscleMass' in latest: metrics['Muscle Mass'] = round(latest['muscleMass'] * 0.00220462, 1)
                if 'bodyFat' in latest: metrics['Body Fat %'] = latest['bodyFat']

        # Method B: Body Composition (Index Scale / Fallback)
        if 'Weight (lbs)' not in metrics:
            comp = client.get_body_composition(date_str)
            if comp and 'totalAverage' in comp and comp['totalAverage']:
                avg = comp['totalAverage']
                if avg.get('weight'):
                    metrics['Weight (lbs)'] = round(avg['weight'] * 0.00220462, 1)
                if avg.get('muscleMass'):
                    metrics['Muscle Mass'] = round(avg['muscleMass'] * 0.00220462, 1)
                if avg.get('bodyFat'):
                    metrics['Body Fat %'] = avg['bodyFat']
    except Exception: pass
    return metrics

# --- 5. CURRENT SETTINGS ---
def fetch_current_ftp(client):
    try:
        ftp_data = client.get_cycling_ftp()
        if isinstance(ftp_data, dict) and 'functionalThresholdPower' in ftp_data:
            return ftp_data['functionalThresholdPower']
        elif isinstance(ftp_data, (int, float)):
            return ftp_data
    except Exception: pass
    return None

# --- MAIN LOOP ---
def fetch_daily_stats(client, start_date, end_date):
    days = (end_date - start_date).days + 1
    print(f"📡 Fetching {days} days of data ({start_date} to {end_date})...")
    
    current_ftp = fetch_current_ftp(client)
    all_data = []
    
    global DEBUG
    
    for i in range(days):
        current_date = start_date + timedelta(days=i)
        date_str = current_date.isoformat()
        is_today = (current_date == date.today())
        
        row = {}
        
        try:
            # Gather all metrics
            row.update(extract_health_summary(client, date_str))
            row.update(fetch_advanced_metrics(client, date_str))
            row.update(fetch_activity_performance(client, date_str))
            row.update(fetch_body_comp(client, date_str))

            if is_today and current_ftp:
                row['FTP'] = current_ftp

            # DEBUG: Dump first day to see raw response structures
            if DEBUG and len(row) > 1:
                debug_log(f"Combined Data for {date_str}", row)
                DEBUG = False 

            # VISUAL CONFIRMATION: Print ALL captured keys for this day
            if len(row) > 1:
                print(f"   ✅ {date_str}: {len(row)} metrics found.")
                # Print a clean summary of what we actually got
                keys_found = [k for k in row.keys() if k != 'Date']
                print(f"      Running keys: {keys_found}")
                all_data.append(row)
            else:
                print(f"   ⚠️ {date_str}: No data.")
                
        except Exception as e:
            print(f"   ❌ {date_str}: Error ({str(e)})")
        
        time.sleep(1.0) 

    return all_data

# --- JSON SAVE ---
def load_existing_data():
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, ValueError):
            return []
    return []

def get_start_date(existing_data):
    # FORCE RESCAN of last 7 days to capture new fields
    return date.today() - timedelta(days=7)

def save_json_data(new_data, existing_data):
    if not new_data: return

    data_map = {item['Date']: item for item in existing_data if 'Date' in item}
    
    for item in new_data:
        if 'Date' in item:
            if item['Date'] in data_map:
                data_map[item['Date']].update(item)
            else:
                data_map[item['Date']] = item

    final_list = sorted(data_map.values(), key=lambda x: x['Date'], reverse=True)

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_list, f, indent=4)
    print(f"💾 Saved {len(final_list)} records to {OUTPUT_FILE}")

def main():
    client = init_garmin()
    existing_data = load_existing_data()
    
    today = date.today()
    start_date = get_start_date(existing_data)
    
    if start_date > today:
        print("✅ Data is already up to date.")
        return

    new_data = fetch_daily_stats(client, start_date, today)
    save_json_data(new_data, existing_data)

if __name__ == "__main__":
    main()
