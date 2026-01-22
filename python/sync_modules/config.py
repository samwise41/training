import os

# --- PROJECT ROOTS ---
# Assumes this runs from python/sync_modules/
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, 'data')
DASHBOARD_DIR = os.path.join(DATA_DIR, 'dashboard')

# Safety Check: Create the directory if it doesn't exist
if not os.path.exists(DASHBOARD_DIR):
    os.makedirs(DASHBOARD_DIR)

# --- FILE PATHS ---
GARMIN_JSON = os.path.join(DATA_DIR, 'my_garmin_data_ALL.json')
PLANNED_JSON = os.path.join(DASHBOARD_DIR, 'planned.json') 
MASTER_DB_JSON = os.path.join(DATA_DIR, 'training_log.json')
COACH_BRIEFING_MD = os.path.join(DATA_DIR, 'COACH_BRIEFING.md')
PLAN_MARKDOWN = os.path.join(BASE_DIR, 'endurance_plan.md')

# --- SETTINGS ---
GARMIN_FETCH_LIMIT = 40
ALLOWED_SPORT_TYPES = [1, 2, 5, 255]  # Run, Bike, Swim, Other (Garmin IDs)

# Set your timezone here. 
# This handles DST automatically (e.g., -6 in Summer, -7 in Winter for Mountain Time).
USER_TIMEZONE = "America/Denver"

# Sport Tag Mapping for Plan Parsing
SPORT_TAGS = {
    '[RUN]': 'Run',
    '[BIKE]': 'Bike',
    '[SWIM]': 'Swim'
}
