import requests
import json
import os
import re

# The Raw URL of the GitHub .mjs file you found
COMMUNITY_URL = "https://raw.githubusercontent.com/andipaetzold/zwift-data/main/data/routes.mjs"

def load_json(filename):
    if os.path.exists(filename):
        with open(filename, "r") as f:
            return json.load(f)
    return {}

def save_json(data, filename):
    with open(filename, "w") as f:
        json.dump(data, f, indent=4)
    print(f"💾 Saved updates to {filename}")

def fetch_community_routes():
    print("🌐 Fetching community .mjs routes from GitHub...")
    community_routes = {}
    try:
        response = requests.get(COMMUNITY_URL, timeout=10)
        if response.status_code == 200:
            text = response.text
            
            # Since it's a JS file, we split the text by curly braces to isolate each route
            blocks = re.split(r'\}\s*,?', text)
            
            for block in blocks:
                # Regex search for the specific keys in the Javascript object
                id_match = re.search(r'(?:id|routeId):\s*([0-9]{1,15})', block)
                name_match = re.search(r'name:\s*[\'"]([^\'"]+)[\'"]', block)
                dist_match = re.search(r'distance:\s*([\d.]+)', block)
                
                # Check for leadInDistance (or variations)
                leadin_match = re.search(r'leadInDistance:\s*([\d.]+)', block)
                if not leadin_match:
                    leadin_match = re.search(r'(?:leadIn|leadin_distance):\s*([\d.]+)', block)
                
                if id_match and name_match:
                    route_id = id_match.group(1)
                    name = name_match.group(1)
                    
                    dist = float(dist_match.group(1)) if dist_match else 0.0
                    leadin = float(leadin_match.group(1)) if leadin_match else 0.0
                    
                    # Sanity check: If the distance is listed in meters (e.g. 15000) instead of km, convert it
                    if dist > 500: dist = dist / 1000.0
                    if leadin > 500: leadin = leadin / 1000.0

                    community_routes[route_id] = {
                        "name": name,
                        "lap_km": round(dist, 1),
                        "leadin_km": round(leadin, 1)
                    }
            
            print(f"✅ Successfully extracted and parsed {len(community_routes)} routes from the .mjs file!")
            return community_routes
        else:
            print(f"⚠️ Community URL returned status code: {response.status_code}")
    except Exception as e:
        print(f"⚠️ Could not fetch or parse community routes: {e}")
    return {}

def build_event_list():
    url = "https://us-or-rly101.zwift.com/api/public/events/upcoming"
    headers = {"User-Agent": "ZwiftCustomFilter/1.0"}
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status() 
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to fetch events: {e}")
        return

    events_data = response.json()
    
    local_routes = load_json("routes.json")
    unknown_routes = load_json("unknown_routes.json")
    community_routes = fetch_community_routes()
    
    routes_updated = False
    unknown_updated = False
    all_events = []

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

            calculated_distance_km = 0.0
            route_name = "Unknown Route"

            if dist > 0:
                calculated_distance_km = round(dist / 1000, 1)
            elif laps > 0 and route_id:
                str_route_id = str(route_id) 
                route_info = None
                
                # Check Community First
                if str_route_id in community_routes:
                    route_info = community_routes[str_route_id]
                    if str_route_id not in local_routes:
                        local_routes[str_route_id] = route_info
                        routes_updated = True
                        
                        if str_route_id in unknown_routes:
                            del unknown_routes[str_route_id]
                            unknown_updated = True
                
                # Check Local Second
                elif str_route_id in local_routes:
                    route_info = local_routes[str_route_id]
                
                # Do the Math
                if route_info:
                    route_name = route_info.get("name", "Unknown")
                    lap_km = route_info.get("lap_km", 0.0)
                    leadin_km = route_info.get("leadin_km", 0.0)
                    total_km = (laps * lap_km) + leadin_km
                    calculated_distance_km = round(total_km, 1)
                else:
                    # Log Unknowns
                    if str_route_id not in unknown_routes:
                        unknown_routes[str_route_id] = {
                            "name": f"UNKNOWN_ROUTE (Found in: {name})",
                            "lap_km": 0.0,
                            "leadin_km": 0.0
                        }
                        unknown_updated = True

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

    save_json(all_events, "events.json")
    print(f"✅ Successfully saved {len(all_events)} events.")
    
    if routes_updated:
        save_json(local_routes, "routes.json")
    if unknown_updated:
        save_json(unknown_routes, "unknown_routes.json")

if __name__ == "__main__":
    build_event_list()
