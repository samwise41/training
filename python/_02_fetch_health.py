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

# Set to True to see raw API responses in your GitHub Action logs
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
        # Truncate long lists to avoid massive logs
        if isinstance(data, list) and len(data) > 3:
            print(json.dumps(data[:2], indent=2, default=str))
            print(f"... ({len(data)-2} more items) ...")
        else:
            print(json.dumps(data, indent=2, default=str))
        print("------------------------\n")

# --- 1. BASE HEALTH SUMMARY ---
def extract_health_summary(client, date_str):
    """
    Fetches the main User Summary which contains Steps, Floors, Stress, etc.
    """
    row = {}
    try:
        summary = client.get_user_summary(date_str)
        if not summary: return row
        
        row['Date'] = date_str
        
        # Mapping API keys to Readable Names
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

        # Calculate Sleep Hours
        if 'sleepingSeconds' in summary and summary['sleepingSeconds']:
            row['Sleep Hours'] = round(summary['sleepingSeconds'] / 3600, 1)
            
    except Exception as e:
        if DEBUG: print(f"   ⚠️ Summary Error: {e}")
        
    return row

# --- 2. ADVANCED METRICS FETCHER ---
def fetch_advanced_metrics(client, date_str):
    """
    Fetches specific advanced metrics requested by the user.
    """
    metrics = {}
    
    # A. Training Readiness (Morning)
    try:
        readiness = client.get_morning_training_readiness(date_str)
        if readiness and 'trainingReadinessScore' in readiness:
            metrics['Readiness Score'] = readiness['trainingReadinessScore']
    except Exception: pass

    # B. Training Status (Load / Heat)
    try:
        status = client.get_training_status(date_str)
        if status:
            latest = status[-1] # Get most recent for the day
            if 'heatAdaptation' in latest:
                metrics['Heat Adaptation'] = latest['heatAdaptation']
            if 'altitudeAdaptation' in latest:
                metrics['Altitude Adaptation'] = latest['altitudeAdaptation']
            if 'load' in latest:
                metrics['Acute Load'] = latest['load']
    except Exception: pass

    # C. Respiration
    try:
        resp = client.get_respiration_data(date_str)
        if resp and 'avgWakingRespirationValue' in resp:
            metrics['Respiration Avg'] = resp['avgWakingRespirationValue']
    except Exception: pass

    # D. SpO2 (Pulse Ox)
    try:
        spo2 = client.get_spo2_data(date_str)
        if spo2 and 'averageSpO2' in spo2:
            metrics['SpO2 Avg'] = spo2['averageSpO2']
        elif spo2 and 'userProfilePk' in spo2: # Sometimes structure varies
             pass # Add parsing if needed for specific SpO2 graph
    except Exception: pass

    # E. HRV Data
    try:
        hrv = client.get_hrv_data(date_str)
        if hrv and 'hrvSummary' in hrv:
            metrics['HRV Night Avg'] = hrv['hrvSummary'].get('weeklyAverage')
            metrics['HRV Last Night'] = hrv['hrvSummary'].get('lastNightAverage')
    except Exception: pass

    # F. Fitness Age & VO2 (Max Metrics)
    try:
        max_m = client.get_max_metrics(date_str)
        if max_m:
            for item in max_m:
                if 'generic' in item:
                    if 'vo2MaxValue' in item['generic']:
                        metrics['VO2 Max'] = item['generic']['vo2MaxValue']
                    if 'fitnessAge' in item['generic']:
                        metrics['Fitness Age'] = item['generic']['fitnessAge']
    except Exception: pass

    # G. Intensity Minutes
    try:
        minutes = client.get_intensity_minutes_data(date_str)
        if minutes and 'dailyModerateIntensityMinutes' in minutes:
            metrics['Intensity Min Mod'] = minutes['dailyModerateIntensityMinutes']
            metrics['Intensity Min Vig'] = minutes['dailyVigorousIntensityMinutes']
    except Exception: pass

    # H. Blood Pressure (Average of day's readings)
    try:
        bp_data = client.get_blood_pressure(date_str, date_str)
        if bp_data and 'measurementSummaries' in bp_data:
            measurements = []
            for summary in bp_data['measurementSummaries']:
                measurements.extend(summary.get('measurements', []))
            
            if measurements:
                avg_sys = sum(m['systolic'] for m in measurements) / len(measurements)
                avg_dia = sum(m['diastolic'] for m in measurements) / len(measurements)
                metrics['BP Systolic'] = round(avg_sys)
                metrics['BP Diastolic'] = round(avg_dia)
    except Exception: pass

    return metrics

# --- 3. ACTIVITY & PERFORMANCE (Run/Bike) ---
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
                
                # Grab latest Run Cadence
                cad = act.get('averageRunningCadenceInStepsPerMinute')
                if cad: metrics['Run Avg Cadence'] = cad

        if run_dist > 0 and run_time > 0:
            metrics['Run Avg Speed (m/s)'] = round(run_dist / run_time, 2)

    except Exception: pass
    return metrics

# --- 4. BODY COMPOSITION ---
def fetch_body_comp(client, date_str):
    metrics = {}
    try:
        # Priority 1: Daily Weigh-ins (Specific Endpoint)
        weigh_ins = client.get_daily_weigh_ins(date_str)
        if weigh_ins and 'dateWeightList' in weigh_ins and weigh_ins['dateWeightList']:
            latest = weigh_ins['dateWeightList'][-1] # Last weigh-in of day
            if 'weight' in latest:
                # API returns grams, convert to lbs
                metrics['Weight (lbs)'] = round(latest['weight'] * 0.00220462, 1)
                
        # Priority 2: Body Comp (Index Scale)
        if 'Weight (lbs)' not in metrics:
            comp = client.get_body_composition(date_str)
            if comp and 'totalAverage' in comp and comp['totalAverage']:
                w_g = comp['totalAverage'].get('weight')
                if w_g:
                    metrics['Weight (lbs)'] = round(w_g * 0.00220462, 1)
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

# --- MAIN FETCH LOOP ---
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
            # 1. Base Health (Steps, Sleep, Stress, Body Batt Min/Max)
            row.update(extract_health_summary(client, date_str))
            
            # 2. Advanced Metrics (Readiness, HRV, SpO2, BP, etc.)
            row.update(fetch_advanced_metrics(client, date_str))
            
            # 3. Activity Perf (Run Speed, Cadence)
            row.update(fetch_activity_performance(client, date_str))
            
            # 4. Weight
            row.update(fetch_body_comp(client, date_str))

            # 5. Inject Current FTP (Only for today/recent to avoid bad history)
            if is_today and current_ftp:
                row['FTP'] = current_ftp

            # Debug Log (Only first day)
            if DEBUG and len(row) > 1:
                debug_log(f"Final Data for {date_str}", row)
                DEBUG = False # Silence after first success

            # Console Progress
            rhr = row.get('Resting HR', '-')
            readiness = row.get('Readiness Score', '-')
            hrv = row.get('HRV Night Avg', '-')
            
            print(f"   ✅ {date_str}: RHR {rhr} | Readiness {readiness} | HRV {hrv}")
            
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
    # OPTIONAL: Set FORCE_RESCAN = True to re-download the last 7 days 
    # and fill in the NEW metrics (Readiness, HRV, etc)
    FORCE_RESCAN = True 
    
    if FORCE_RESCAN:
        print("🔄 Rescanning last 7 days to capture new metrics...")
        return date.today() - timedelta(days=7)

    if not existing_data:
        print("🆕 No existing history found. Fetching last 365 days.")
        return date.today() - timedelta(days=365)
    
    try:
        dates = [d.get('Date') for d in existing_data if d.get('Date')]
        if not dates: return date.today() - timedelta(days=365)
        last_date = date.fromisoformat(max(dates))
        print(f"🔄 Resuming from: {last_date}")
        return last_date
    except Exception:
        return date.today() - timedelta(days=365)

def save_json_data(new_data, existing_data):
    if not new_data: return

    # Merge Logic: Dictionary keyed by Date
    data_map = {item['Date']: item for item in existing_data if 'Date' in item}
    
    for item in new_data:
        if 'Date' in item:
            if item['Date'] in data_map:
                data_map[item['Date']].update(item) # Merge new fields
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
