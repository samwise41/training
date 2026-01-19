import os
import json
import logging
from garminconnect import Garmin
from . import config

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_credentials():
    email = os.getenv("GARMIN_EMAIL")
    password = os.getenv("GARMIN_PASSWORD")
    if not email or not password:
        raise ValueError("Missing GARMIN_EMAIL or GARMIN_PASSWORD environment variables.")
    return email, password

def load_cache():
    if not os.path.exists(config.GARMIN_JSON):
        return []
    with open(config.GARMIN_JSON, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_cache(data):
    os.makedirs(os.path.dirname(config.GARMIN_JSON), exist_ok=True)
    with open(config.GARMIN_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)

def normalize_rpe(val):
    # Garmin RPE is often 1-100 or 10-100. Normalize to 1-10.
    if val is None: return None
    if val > 10: return round(val / 10, 1)
    return val

def normalize_feeling(val):
    # Garmin Feeling is often 0-100. Normalize to 1-5.
    if val is None: return None
    # Heuristic: 0=Very Weak, 100=Very Strong. 
    # Map roughly: 0-20=1, 20-40=2, 40-60=3, 60-80=4, 80-100=5
    return max(1, min(5, round((val / 25) + 1)))

def deep_fetch_activity(client, activity_id):
    """Fetches full activity details to find RPE/Feeling."""
    try:
        act = client.get_activity(activity_id)
        
        rpe = None
        feeling = None

        # Location 1: summaryDTO
        if 'summaryDTO' in act:
            rpe = act['summaryDTO'].get('directWorkoutRpe')
            feeling = act['summaryDTO'].get('directWorkoutFeel')

        # Location 2: metadataDTO (selfEvaluation)
        if not rpe and 'metadataDTO' in act and 'selfEvaluation' in act['metadataDTO']:
            rpe = act['metadataDTO']['selfEvaluation'].get('rating') # Often NULL if not set
            feeling = act['metadataDTO']['selfEvaluation'].get('feeling')

        # Location 3: Root selfEvaluation
        if not rpe and 'selfEvaluation' in act:
            rpe = act['selfEvaluation'].get('rating')
            feeling = act['selfEvaluation'].get('feeling')

        return normalize_rpe(rpe), normalize_feeling(feeling)
    except Exception as e:
        logger.warning(f"Failed to deep fetch activity {activity_id}: {e}")
        return None, None

def main():
    email, password = get_credentials()
    
    print("   -> Authenticating with Garmin Connect...")
    client = Garmin(email, password)
    client.login()
    
    print(f"   -> Fetching last {config.GARMIN_FETCH_LIMIT} activities...")
    activities = client.get_activities(0, config.GARMIN_FETCH_LIMIT)
    
    current_cache = load_cache()
    cache_map = {a['activityId']: a for a in current_cache}
    
    new_count = 0
    updated_count = 0
    
    for activity in activities:
        act_id = activity['activityId']
        sport_type_id = activity.get('sportTypeId')
        
        # Filter Allowed Sports
        if sport_type_id not in config.ALLOWED_SPORT_TYPES:
            continue

        # Check if we need to update or add
        # We deep fetch if it's new OR if we have it but missing RPE (user might have edited it later)
        is_new = act_id not in cache_map
        existing_rpe = cache_map[act_id].get('RPE') if not is_new else None
        
        if is_new or existing_rpe is None:
            rpe, feeling = deep_fetch_activity(client, act_id)
            
            # Inject into the activity object
            activity['RPE'] = rpe
            activity['Feeling'] = feeling
            
            cache_map[act_id] = activity
            if is_new:
                new_count += 1
            else:
                updated_count += 1
        else:
            # Even if we don't deep fetch, ensure the basic metadata is fresh
            # But preserve the RPE/Feeling we already caught
            cached_rpe = cache_map[act_id].get('RPE')
            cached_feeling = cache_map[act_id].get('Feeling')
            activity['RPE'] = cached_rpe
            activity['Feeling'] = cached_feeling
            cache_map[act_id] = activity

    # Convert back to list and sort
    final_list = sorted(list(cache_map.values()), key=lambda x: x['startTimeLocal'], reverse=True)
    save_cache(final_list)
    print(f"   -> Saved {len(final_list)} activities (New: {new_count}, Updated: {updated_count}).")

if __name__ == "__main__":
    main()
