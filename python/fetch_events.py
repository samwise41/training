import requests
import json
from datetime import datetime

def build_event_list():
    url = "https://us-or-rly101.zwift.com/api/public/events/upcoming"
    headers = {"User-Agent": "ZwiftCustomFilter/1.0"}
    
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"Failed to fetch events: {response.status_code}")
        return

    events_data = response.json()
    all_events = []
    
    category_map = {1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E'}

    for event in events_data:
        # Extract top-level details
        name = event.get("name", "Unknown Event")
        event_type = event.get("eventType", "UNKNOWN")
        
        # Keep the raw UTC string for the frontend to parse into local time
        start_str = event.get("eventStart", "")

        # Dive into subgroups to find distance, duration, and categories
        subgroups = event.get("eventSubgroups", [])
        categories = []
        max_distance = 0
        max_duration = 0
        
        for sg in subgroups:
            label_num = sg.get("subgroupLabel")
            if label_num in category_map:
                categories.append(category_map[label_num])
                
            # Grab distance (meters) and duration (seconds)
            dist = sg.get("distanceInMeters", 0)
            if dist > max_distance:
                max_distance = dist
                
            dur = sg.get("durationInSeconds", 0)
            if dur > max_duration:
                max_duration = dur

        # Append all parsed data (no filtering)
        all_events.append({
            "id": event.get("id"),
            "title": name,
            "start_time_utc": start_str, # Frontend JS will convert this to local time
            "type": event_type,
            "categories": sorted(list(set(categories))),
            "distance_km": round(max_distance / 1000, 1),
            "duration_minutes": round(max_duration / 60, 1)
        })

    # Write the compiled list to a JSON file
    with open("events.json", "w") as outfile:
        json.dump(all_events, outfile, indent=4)
        
    print(f"Successfully saved {len(all_events)} events to events.json")

if __name__ == "__main__":
    build_event_list()

        # ... (previous code above this stays the same)
        
        # Dive into subgroups to find distance, duration, categories, and SCORE
        subgroups = event.get("eventSubgroups", [])
        
        # We will use a dictionary for categories now so we can store the score bounds
        # Example format: {"A": {"min": 690, "max": 1000}, "B": {"min": 520, "max": 690}}
        category_details = {} 
        max_distance = 0
        max_duration = 0
        
        for sg in subgroups:
            label_num = sg.get("subgroupLabel")
            
            # Grab the Zwift Racing Score (ZRS) boundaries. 
            # We use .get() with a default of None in case it's a non-scored event
            score_min = sg.get("raceScoreMin", None)
            score_max = sg.get("raceScoreMax", None)

            if label_num in category_map:
                cat_letter = category_map[label_num]
                category_details[cat_letter] = {
                    "score_min": score_min,
                    "score_max": score_max
                }
                
            # Grab distance (meters) and duration (seconds)
            dist = sg.get("distanceInMeters", 0)
            if dist > max_distance:
                max_distance = dist
                
            dur = sg.get("durationInSeconds", 0)
            if dur > max_duration:
                max_duration = dur

        # Append all parsed data (no filtering)
        all_events.append({
            "id": event.get("id"),
            "title": name,
            "start_time_utc": start_str, 
            "type": event_type,
            "categories": category_details, # Now passes the letter AND the score bounds
            "distance_km": round(max_distance / 1000, 1),
            "duration_minutes": round(max_duration / 60, 1)
        })

        # ... (rest of the script to save the JSON stays the same)

