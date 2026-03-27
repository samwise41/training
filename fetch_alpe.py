import os
import json
import requests

# 1. Strava API Credentials from GitHub Secrets
CLIENT_ID = os.environ.get('STRAVA_CLIENT_ID')
CLIENT_SECRET = os.environ.get('STRAVA_CLIENT_SECRET')
REFRESH_TOKEN = os.environ.get('STRAVA_REFRESH_TOKEN')

# Target Hairpin Segment Names (to match Strava's exact names)
HAIRPIN_NAMES = [
    "Start to Bend 21", "Bend 21 to 20", "Bend 20 to 19", "Bend 19 to 18", 
    "Bend 18 to 17", "Bend 17 to 16", "Bend 16 to 15", "Bend 15 to 14", 
    "Bend 14 to 13", "Bend 13 to 12", "Bend 12 to 11", "Bend 11 to 10", 
    "Bend 10 to 9", "Bend 9 to 8", "Bend 8 to 7", "Bend 7 to 6", 
    "Bend 6 to 5", "Bend 5 to 4", "Bend 4 to 3", "Bend 3 to 2", 
    "Bend 2 to 1", "Bend 1 to Banner"
]

def get_access_token():
    """Exchange refresh token for a fresh access token."""
    response = requests.post(
        url='https://www.strava.com/oauth/token',
        data={
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'grant_type': 'refresh_token',
            'refresh_token': REFRESH_TOKEN
        }
    )
    return response.json().get('access_token')

def fetch_alpe_data():
    access_token = get_access_token()
    headers = {'Authorization': f'Bearer {access_token}'}
    
    # Segment ID for full Alpe du Zwift
    ALPE_SEGMENT_ID = 17267489
    
    # 2. Get your Best Effort for the Alpe
    print("Finding your PR for Alpe du Zwift...")
    efforts_url = f'https://www.strava.com/api/v3/segment_efforts?segment_id={ALPE_SEGMENT_ID}&per_page=1'
    efforts_res = requests.get(efforts_url, headers=headers).json()
    
    if not efforts_res:
        print("No Alpe du Zwift efforts found.")
        return

    best_effort = efforts_res[0]
    activity_id = best_effort['activity']['id']
    
    # 3. Get the full Activity details to find the sub-segments (the Hairpins)
    print(f"Fetching Activity {activity_id} to extract hairpins...")
    activity_url = f'https://www.strava.com/api/v3/activities/{activity_id}'
    activity_data = requests.get(activity_url, headers=headers).json()
    
    segment_efforts = activity_data.get('segment_efforts', [])
    
    # 4. Extract and format the data for our HTML app
    pacer_data = []
    
    for target_name in HAIRPIN_NAMES:
        # Find the matching segment effort in the activity
        match = next((seg for seg in segment_efforts if seg['name'] == target_name), None)
        
        if match:
            pacer_data.append({
                "name": target_name,
                "prevSegSec": match['elapsed_time'],
                "prevWatts": round(match.get('average_watts', 0))
            })
        else:
            print(f"Warning: Could not find {target_name} in activity.")
            
    # 5. Save the JSON file
    os.makedirs('data', exist_ok=True)
    with open('data/alpe_pr.json', 'w') as f:
        json.dump(pacer_data, f, indent=4)
    print("Successfully saved data/alpe_pr.json!")

if __name__ == '__main__':
    fetch_alpe_data()
