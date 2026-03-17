import requests
import json
import os

def load_route_db():
    # Look for the routes.json file and load it into a dictionary
    if os.path.exists("routes.json"):
        with open("routes.json", "r") as f:
            return json.load(f)
    print("⚠️ Warning: routes.json not found! Running without route math.")
    return {}

def build_event_list():
    url = "https://us-or-rly101.zwift.com/api/public/events/upcoming"
    headers = {"User-Agent": "ZwiftCustomFilter/1.0"}
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status() 
    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch events: {e}")
        return

    events_data = response.json()
    ROUTE_DB = load_route_db() # Load our separate JSON file
    all_events = []
    missing_routes = set()

    for event in events_data:
        parent_id = event.get("id")
        name = event.get("name", "Unknown Event")
        event_type = event.get("eventType", "UNKNOWN")
        start_str = event.get("eventStart", "")

        subgroups = event.get("eventSubgroups", [])
        categories = {} 
        max_distance = 0
        max_duration = 0
        
        for sg in subgroups:
            dist = sg.get("distanceInMeters", 0)
            dur = sg.get("durationInSeconds", 0)
            laps = sg.get("laps", 0)
            route_id = sg.get("routeId")

            if dist > max_distance: max_distance = dist
            if dur > max_duration: max_duration = dur

            cat_letter = sg.get("subgroupLabel", "Unknown")
            range_label = sg.get("rangeAccessLabel", "")
            score_min, score_max = None, None
            
            if range_label and isinstance(range_label, str):
                parts = range_label.split("-")
                if len(parts) == 2:
                    try:
                        score_min = float(parts[0])
                        score_max = float(parts[1])
                    except ValueError: pass
                elif "+" in range_label: 
                    try:
                        score_min = float(range_label.replace("+", ""))
                        score_max = 1000.0
                    except ValueError: pass
            
            if score_min is None: score_min = sg.get("raceScoreMin")
            if score_max is None: score_max = sg.get("raceScoreMax")

            # ==========================================
            # THE ROUTE JOIN & MATH LOGIC
            # ==========================================
            calculated_distance_km = 0.0
            route_name = "Unknown Route"

            if dist > 0:
                calculated_distance_km = round(dist / 1000, 1)
            elif laps > 0 and route_id:
                # Convert route_id to a string because JSON keys are always strings!
                str_route_id = str(route_id) 
                
                if str_route_id in ROUTE_DB:
                    route_info = ROUTE_DB[str_route_id]
                    route_name = route_info["name"]
                    total_km = (laps * route_info["lap_km"]) + route_info["leadin_km"]
                    calculated_distance_km = round(total_km, 1)
                else:
                    if str_route_id not in missing_routes:
                        missing_routes.add(str_route_id)

            categories[cat_letter] = {
                "subgroup_id": sg.get("id"),
                "route_id": route_id,
                "route_name": route_name,
                "score_min": score_min,
                "score_max": score_max,
                "distance_km": calculated_distance_km,
                "laps": laps
            }

        all_events.append({
            "parent_event_id": parent_id,
            "title": name,
            "start_time_utc": start_str, 
            "type": event_type,
            "categories": categories, 
            "max_distance_km": round(max_distance / 1000, 1),
            "max_duration_minutes": round(max_duration / 60, 1)
        })

    with open("events.json", "w") as outfile:
        json.dump(all_events, outfile, indent=4)
        
    print(f"\n✅ Successfully saved {len(all_events)} events to events.json")
    if missing_routes:
        print(f"⚠️ Notice: You have {len(missing_routes)} missing route IDs to add to your routes.json file:")
        for r_id in missing_routes:
            print(f'  "{r_id}": {{"name": "", "lap_km": 0.0, "leadin_km": 0.0}},')

if __name__ == "__main__":
    build_event_list()
