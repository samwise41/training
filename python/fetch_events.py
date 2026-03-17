import requests
import json
import os
import re
import html

MJS_URL = "https://raw.githubusercontent.com/andipaetzold/zwift-data/main/data/routes.mjs"
MAX_SCRAPES_PER_RUN = 10 

def clean_route_name(raw_name):
    if not raw_name: return "Unknown Route"
    cleaned = html.unescape(raw_name)
    for char in ['“', '”', '"', "'", '&#8220;', '&#8221;']:
        cleaned = cleaned.replace(char, '')
    return cleaned.strip()

def load_json(filename):
    if os.path.exists(filename):
        try:
            with open(filename, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            print(f"🚨 WARNING: {filename} has a syntax error. Returning empty dictionary.")
    return {}

def save_json(data, filename):
    with open(filename, "w") as f:
        json.dump(data, f, indent=4)
    print(f"💾 Saved updates to {filename}")

def fetch_slug_map():
    print("🌐 Fetching slug map from GitHub...")
    slug_map = {}
    try:
        response = requests.get(MJS_URL, timeout=10)
        if response.status_code == 200:
            blocks = response.text.split('id:')
            for block in blocks[1:]:
                id_match = re.match(r'\s*([0-9]+)', block)
                slug_match = re.search(r'slug:\s*[\'"]([^\'"]+)[\'"]', block)
                name_match = re.search(r'name:\s*[\'"]([^\'"]+)[\'"]', block)
                
                if id_match and slug_match:
                    raw_name = name_match.group(1) if name_match else "Unknown Route"
                    slug_map[id_match.group(1)] = {
                        "slug": slug_match.group(1),
                        "name": clean_route_name(raw_name)
                    }
            return slug_map
    except Exception as e:
        print(f"⚠️ Failed to fetch slug map: {e}")
    return slug_map

def scrape_zwift_insider(slug):
    url = f"https://zwiftinsider.com/route/{slug}/"
    print(f"🕵️ Scraping ZwiftInsider: {url}")
    try:
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        if response.status_code == 200:
            page_html = response.text
            
            scraped_name = None
            h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', page_html, re.IGNORECASE)
            if h1_match:
                raw_title = html.unescape(h1_match.group(1))
                quote_match = re.search(r'[“"”](.*?)[“"”]', raw_title)
                if quote_match:
                    scraped_name = clean_route_name(quote_match.group(1))
                else:
                    scraped_name = clean_route_name(re.sub(r'(?i)\s*Route Details.*', '', raw_title))
            
            clean_text = re.sub(r'<[^>]+>', ' ', page_html)
            
            length_match = re.search(r'Length:\s*([\d.]+)\s*km', clean_text, re.IGNORECASE)
            leadin_match = re.search(r'Lead-In:\s*([\d.]+)\s*km', clean_text, re.IGNORECASE)
            
            lap_km = float(length_match.group(1)) if length_match else 0.0
            leadin_km = float(leadin_match.group(1)) if leadin_match else 0.0
            
            return lap_km, leadin_km, scraped_name
    except Exception as e:
        print(f"⚠️ Failed to scrape ZwiftInsider for {slug}: {e}")
    return None, None, None

def build_event_list():
    headers = {"User-Agent": "ZwiftCustomFilter/1.0"}
    events_data = []
    
    # 1. Paginator: Ask for 200 at a time until the calendar is empty
    start = 0
    limit = 200
    print("🌐 Fetching events from Zwift...")
    while True:
        url = f"https://us-or-rly101.zwift.com/api/public/events/upcoming?limit={limit}&start={start}"
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status() 
            batch = response.json()
            
            if not batch:
                break
                
            events_data.extend(batch)
            print(f"   ...fetched {len(events_data)} events so far...")
            
            if len(batch) < limit:
                break # We reached the end of the calendar
                
            start += limit
        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to fetch events: {e}")
            break

    print(f"✅ Fetched a total of {len(events_data)} raw events!")
    
    local_routes = load_json("routes.json")
    unknown_routes = load_json("unknown_routes.json")
    
    slug_map = None 
    routes_updated = False
    unknown_updated = False
    scrapes_performed = 0  
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
                        score_min, score_max = float(parts[0]), float(parts[1])
                    except ValueError: pass
                elif "+" in range_label: 
                    try:
                        score_min, score_max = float(range_label.replace("+", "")), 1000.0
                    except ValueError: pass
            
            if score_min is None: score_min = sg.get("raceScoreMin")
            if score_max is None: score_max = sg.get("raceScoreMax")

            route_info = None
            str_route_id = str(route_id) if route_id else None

            if str_route_id:
                # 1. Check Local DB
                if str_route_id in local_routes:
                    route_info = local_routes[str_route_id]
                    cleaned_local_name = clean_route_name(route_info.get("name", ""))
                    if cleaned_local_name != route_info.get("name"):
                        route_info["name"] = cleaned_local_name
                        local_routes[str_route_id] = route_info
                        routes_updated = True
                
                # 2. Check if it's already in the backlog (Failed previously)
                elif str_route_id in unknown_routes:
                    route_info = unknown_routes[str_route_id]
                
                # 3. Try to Scrape (First time seeing it)
                else:
                    if slug_map is None:
                        slug_map = fetch_slug_map() 
                    
                    if str_route_id in slug_map:
                        route_data = slug_map[str_route_id]
                        fallback_name = route_data["name"]
                        slug = route_data["slug"]
                        
                        if scrapes_performed < MAX_SCRAPES_PER_RUN:
                            lap_km, leadin_km, scraped_name = scrape_zwift_insider(slug)
                            scrapes_performed += 1
                            
                            if lap_km is not None:
                                final_name = scraped_name if scraped_name else fallback_name
                                route_info = {
                                    "name": final_name,
                                    "lap_km": lap_km,
                                    "leadin_km": leadin_km
                                }
                                local_routes[str_route_id] = route_info
                                routes_updated = True
                                print(f"✨ Auto-Scraped: {final_name} ({lap_km}km lap)")
                            else:
                                print(f"❌ Scrape failed for slug '{slug}'. Adding to backlog.")
                                unknown_routes[str_route_id] = {"name": fallback_name, "lap_km": 0.0, "leadin_km": 0.0}
                                unknown_updated = True
                                route_info = unknown_routes[str_route_id]
                        else:
                            pass
                    else:
                        unknown_routes[str_route_id] = {"name": f"UNKNOWN (Event: {name})", "lap_km": 0.0, "leadin_km": 0.0}
                        unknown_updated = True
                        route_info = unknown_routes[str_route_id]

            if route_info:
                route_name = route_info.get("name", "Unknown Route")
                lap_km = route_info.get("lap_km", 0.0)
                leadin_km = route_info.get("leadin_km", 0.0)
            else:
                route_name = "Unknown Route"
                lap_km = 0.0
                leadin_km = 0.0

            calculated_distance_km = 0.0
            if dist > 0:
                calculated_distance_km = round(dist / 1000, 1)
            elif laps > 0 and route_info:
                calculated_distance_km = round((laps * lap_km) + leadin_km, 1)

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
    print(f"\n✅ Successfully saved {len(all_events)} events.")
    print(f"📡 Scrapes performed this run: {scrapes_performed}/{MAX_SCRAPES_PER_RUN}")
    
    if routes_updated:
        save_json(local_routes, "routes.json")
    if unknown_updated:
        save_json(unknown_routes, "unknown_routes.json")
        print(f"🛠️ {len(unknown_routes)} routes are sitting in your backlog. Check them manually!")

if __name__ == "__main__":
    build_event_list()
