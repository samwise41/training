import requests
import json

def build_event_list():
    url = "https://us-or-rly101.zwift.com/api/public/events/upcoming"
    headers = {"User-Agent": "ZwiftCustomFilter/1.0"}
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status() # This will catch any 404 or 500 errors
    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch events: {e}")
        return

    events_data = response.json()
    all_events = []
    
    category_map = {1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E'}

    for event in events_data:
        # Extract top-level details
        event_id = event.get("id")
        name = event.get("name", "Unknown Event")
        event_type = event.get("eventType", "UNKNOWN")
        
        # Keep the raw UTC string for the frontend to parse into local time
        start_str = event.get("eventStart", "")

        # Dive into subgroups to find distance, duration, categories, and scores
        subgroups = event.get("eventSubgroups", [])
        
        category_details = {} 
        max_distance = 0
        max_duration = 0
        
        for sg in subgroups:
            # Grab distance (meters) and duration (seconds)
            dist = sg.get("distanceInMeters", 0)
            if dist > max_distance:
                max_distance = dist
                
            dur = sg.get("durationInSeconds", 0)
            if dur > max_duration:
                max_duration = dur

            # Map category and grab Zwift Racing Scores
            label_num = sg.get("subgroupLabel")
            if label_num in category_map:
                cat_letter = category_map[label_num]
                
                # ZRS boundaries (defaults to None if it's a non-scored event)
                score_min = sg.get("raceScoreMin")
                score_max = sg.get("raceScoreMax")
                
                category_details[cat_letter] = {
                    "score_min": score_min,
                    "score_max": score_max,
                    "distance_km": round(dist / 1000, 1) # Specific distance for this pen
                }

        # Append all parsed data to our main list
        all_events.append({
            "id": event_id,
            "title": name,
            "start_time_utc": start_str, 
            "type": event_type,
            "categories": category_details,
            "max_distance_km": round(max_distance / 1000, 1),
            "max_duration_minutes": round(max_duration / 60, 1)
        })

    # Write the compiled list to a JSON file
    with open("events.json", "w") as outfile:
        json.dump(all_events, outfile, indent=4)
        
    print(f"Successfully saved {len(all_events)} events to events.json")

if __name__ == "__main__":
    build_event_list()
