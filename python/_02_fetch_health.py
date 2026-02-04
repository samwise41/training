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

# DEBUG: Keeps raw logs enabled for the first day to verify data structures
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
def debug_dump(title, data):
    if DEBUG and data:
        print(f"\n🔍 RAW {title}:")
        try:
            print(json.dumps(data, indent=2, default=str))
        except:
            print(str(data))
        print("------------------------\n")

# --- 1. BASE HEALTH SUMMARY ---
def extract_health_summary(client, date_str):
    row = {}
    try:
        summary = client.get_user_summary(date_str)
        if not summary: return row
        
        row['Date'] = date_str
        
        field_map = {
            'restingHeartRate': 'Resting HR',
            'minHeartRate': 'Min HR',
            'maxHeartRate': 'Max HR',
            'averageStressLevel': 'Stress Avg',
            'maxStressLevel': 'Stress Max',
            'totalSteps': 'Steps',
            'dailyStepGoal': 'Steps Goal',
            'totalDistanceMeters': 'Daily Distance (m)',
            'floorsClimbed': 'Floors Climbed', 
            'activeCalories': 'Active Cals',
            'bodyBatteryHighestValue': 'Body Batt Max',
            'bodyBatteryLowestValue': 'Body Batt Min',
            'sleepScore': 'Sleep Score',
            'hrvStatusBalanced': 'HRV Status',
            'vo2MaxValue': 'VO2 Max', 
            'weight': 'Weight (grams)'
        }

        for api_key, nice_name in field_map.items():
            if api_key in summary and summary[api_key] is not None:
                row[nice_name] = summary[api_key]

        if 'sleepingSeconds' in summary and summary['sleepingSeconds']:
            row['Sleep Hours'] = round(summary['sleepingSeconds'] / 3600, 1)

        if 'Weight (grams)' in row:
            row['Weight (lbs)'] = round(row['Weight (grams)'] * 0.00220462, 1)
            del row['Weight (grams)'] 
            
    except Exception: pass
    return row

# --- 2. ADVANCED METRICS FETCHER (Robust) ---
def fetch_advanced_metrics(client, date_str):
    metrics = {}
    
    # A. Readiness
    try:
        readiness = client.get_morning_training_readiness(date_str)
        if readiness and isinstance(readiness, dict):
            if 'trainingReadinessScore' in readiness:
                metrics['Readiness Score'] = readiness['trainingReadinessScore']
    except Exception: pass

    # B. Training Status
    try:
        status = client.get_training_status(date_str)
        latest = None
        if isinstance(status, list) and status: latest = status[-1]
        elif isinstance(status, dict): latest = status
        
        if latest:
            if 'heatAdaptation' in latest: metrics['Heat Adaptation'] = latest['heatAdaptation']
            if 'altitudeAdaptation' in latest: metrics['Altitude Adaptation'] = latest['altitudeAdaptation']
            if 'load' in latest: metrics['Acute Load'] = latest['load']
            if 'vo2Max' in latest: metrics['VO2 Max'] = latest['vo2Max']
    except Exception: pass

    # C. Respiration
    try:
        resp = client.get_respiration_data(date_str)
        if resp and isinstance(resp, dict) and 'avgWakingRespirationValue' in resp:
            metrics['Respiration Avg'] = resp['avgWakingRespirationValue']
    except Exception: pass

    # D. SpO2
    try:
        spo2 = client.get_spo2_data(date_str)
        if spo2 and isinstance(spo2, dict) and 'averageSpO2' in spo2:
            metrics['SpO2 Avg'] = spo2['averageSpO2']
    except Exception: pass

    # E. HRV
    try:
        hrv = client.get_hrv_data(date_str)
        if hrv and isinstance(hrv, dict) and 'hrvSummary' in hrv:
            summary = hrv['hrvSummary']
            if 'weeklyAverage' in summary: metrics['HRV Night Avg'] = summary['weeklyAverage']
            if 'lastNightAverage' in summary: metrics['HRV Last Night'] = summary['lastNightAverage']
    except Exception: pass

    # F. Floors
    try:
        floors = client.get_floors(date_str)
        if floors and isinstance(floors, dict):
            if 'floorGoal' in floors: metrics['Floors Goal'] = floors['floorGoal']
            if 'floorsDescended' in floors: metrics['Floors Descended'] = floors['floorsDescended']
            if 'floorsClimbed' in floors: metrics['Floors Climbed'] = floors['floorsClimbed']
    except Exception: pass

    # G. Fitness Age & VO2 (Max Metrics)
    try:
        max_m = client.get_max_metrics(date_str)
        if max_m and isinstance(max_m, list):
            for item in max_m:
                if 'generic' in item:
                    if 'vo2MaxValue' in item['generic']: metrics['VO2 Max'] = item['generic']['vo2MaxValue']
                    if 'fitnessAge' in item['generic']: metrics['Fitness Age'] = item['generic']['fitnessAge']
                if 'running' in item and 'vo2MaxPreciseValue' in item['running']:
                     metrics['VO2 Max'] = int(item['running']['vo2MaxPreciseValue'])
                if 'cycling' in item and 'vo2MaxPreciseValue' in item['cycling'] and 'VO2 Max' not in metrics:
                     metrics['VO2 Max'] = int(item['cycling']['vo2MaxPreciseValue'])
    except Exception: pass
    
    # G2. Explicit Fitness Age
    if 'Fitness Age' not in metrics:
        try:
            fit_age = client.get_fitnessage_data(date_str)
            fa_data = None
            if isinstance(fit_age, list) and fit_age: fa_data = fit_age[-1]
            elif isinstance(fit_age, dict): fa_data = fit_age
            if fa_data and 'fitnessAge' in fa_data:
                metrics['Fitness Age'] = fa_data['fitnessAge']
        except Exception: pass

    # [cite_start]H. Intensity Minutes (UPDATED: Corrected keys based on your raw data) [cite: 1]
    try:
        minutes = client.get_intensity_minutes_data(date_str)
        if DEBUG: debug_dump("Intensity Min", minutes)

        if minutes and isinstance(minutes, dict):
            # Garmin uses 'moderateMinutes' and 'vigorousMinutes' in this endpoint
            mod = minutes.get('moderateMinutes', 0)
            vig = minutes.get('vigorousMinutes', 0)
            
            metrics['Intensity Min Mod'] = mod
            metrics['Intensity Min Vig'] = vig
            # Calculate total (Vigorous counts x2 usually, but here just raw sum or official weeklyTotal)
            metrics['Intensity Min Total'] = mod + (vig * 2)
    except Exception: pass

    # I. Blood Pressure
    try:
        bp_data = client.get_blood_pressure(date_str, date_str)
        if bp_data and 'measurementSummaries' in bp_data:
            readings = []
            for summary in bp_data['measurementSummaries']:
                if 'measurements' in summary: readings.extend(summary['measurements'])
            if readings:
                sys_sum = sum(r['systolic'] for r in readings if 'systolic' in r)
                dia_sum = sum(r['diastolic'] for r in readings if 'diastolic' in r)
                count = len(readings)
                if count > 0:
                    metrics['BP Systolic'] = round(sys_sum / count)
                    metrics['BP Diastolic'] = round(dia_sum / count)
    except Exception: pass

    return metrics

# --- 3. ACTIVITY & PERFORMANCE ---
def fetch_activity_metrics(client, date_str):
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

# --- 4. BODY COMPOSITION ---
def fetch_body_comp(client, date_str):
    metrics = {}
    try:
        # Priority: Daily Weigh-Ins
        weigh_ins = client.get_daily_weigh_ins(date_str)
        if weigh_ins and 'dateWeightList' in weigh_ins:
            valid = [w for w in weigh_ins['dateWeightList'] if w['weight'] > 0]
            if valid:
                latest = valid[-1]
                metrics['Weight (lbs)'] = round(latest['weight'] * 0.00220462, 1)
                if 'muscleMass' in latest: metrics['Muscle Mass'] = round(latest['muscleMass'] * 0.00220462, 1)
                if 'bodyFat' in latest: metrics['Body Fat %'] = latest['bodyFat']
                return metrics

        # Fallback: Index Scale
        comp = client.get_body_composition(date_str)
        if comp and 'totalAverage' in comp and comp['totalAverage']:
            avg = comp['totalAverage']
            if avg.get('weight'): metrics['Weight (lbs)'] = round(avg['weight'] * 0.00220462, 1)
            if avg.get('muscleMass'): metrics['Muscle Mass'] = round(avg['muscleMass'] * 0.00220462, 1)
            if avg.get('bodyFat'): metrics['Body Fat %'] = avg['bodyFat']
    except Exception: pass
    return metrics

# --- MAIN LOOP ---
def fetch_daily_stats(client, start_date, end_date):
    days = (end_date - start_date).days + 1
    print(f"📡 Fetching {days} days of data ({start_date} to {end_date})...")
    
    current_ftp = None
    try:
        ftp_data = client.get_cycling_ftp()
        if isinstance(ftp_data, dict): current_ftp = ftp_data.get('functionalThresholdPower')
        elif isinstance(ftp_data, (int, float)): current_ftp = ftp_data
    except: pass

    all_data = []
    global DEBUG
    
    for i in range(days):
        current_date = start_date + timedelta(days=i)
        date_str = current_date.isoformat()
        is_today = (current_date == date.today())
        
        row = {}
        
        try:
            row.update(extract_health_summary(client, date_str))
            row.update(fetch_advanced_metrics(client, date_str))
            row.update(fetch_activity_metrics(client, date_str))
            row.update(fetch_body_comp(client, date_str))

            if is_today and current_ftp:
                row['FTP'] = current_ftp

            if len(row) > 1:
                if DEBUG:
                    # Print success list to verify
                    print(f"   ✅ {date_str} Captured Keys: {list(row.keys())}")
                    # Only turn off debug if we actually found what we wanted
                    if 'Intensity Min Vig' in row: DEBUG = False 
                else:
                    print(f"   ✅ {date_str}: {len(row)} metrics.")
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
        except: return []
    return []

def get_start_date(existing_data):
    # Rescan last week to catch new metrics
    return date.today() - timedelta(days=7)

def save_json_data(new_data, existing_data):
    if not new_data: return

    data_map = {item['Date']: item for item in existing_data if 'Date' in item}
    for item in new_data:
        if 'Date' in item:
            if item['Date'] in data_map: data_map[item['Date']].update(item)
            else: data_map[item['Date']] = item

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
