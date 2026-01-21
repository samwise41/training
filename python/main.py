import sys
import os
import subprocess

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
sys.path.append(SCRIPT_DIR)

# --- Strava Scripts ---
STRAVA_CYCLING_SCRIPT = os.path.join(ROOT_DIR, 'strava_data', 'cycling', 'process_cycling.py')
STRAVA_RUNNING_SCRIPT = os.path.join(ROOT_DIR, 'strava_data', 'running', 'process_running.py')

# --- Imports ---
from sync_modules import fetch_garmin, sync_database, analyze_trends, update_visuals, git_ops

# Import Generators (If these fail, we WANT the script to crash so we know why)
from zones import createZones
from gear import createGear
from readiness import createReadiness
from dashboard import calculateHeatmaps, calculate_streaks, generate_plannedWorkouts, generate_top_cards
from Trends import createTrends

def main():
    print("🚀 STARTING PIPELINE")
    
    # STEP 1: Garmin
    print("\n[STEP 1] Fetching Garmin...")
    fetch_garmin.main()

    # STEP 1.5: Strava
    print("\n[STEP 1.5] Syncing Strava...")
    if os.path.exists(STRAVA_CYCLING_SCRIPT):
        subprocess.run([sys.executable, STRAVA_CYCLING_SCRIPT], check=True)
    if os.path.exists(STRAVA_RUNNING_SCRIPT):
        subprocess.run([sys.executable, STRAVA_RUNNING_SCRIPT], check=True)

    # STEP 2: Database (Plan + Actuals)
    print("\n[STEP 2] Syncing Database...")
    sync_database.main()

    # STEP 2.5: Dashboard Generators (CRITICAL STEP)
    # We run these explicitly now. If one fails, the pipeline stops here.
    print("\n[STEP 2.5] Generating Dashboard Tabs...")
    
    print("   -> Zones...")
    createZones.main()
    
    print("   -> Gear...")
    createGear.main()
    
    print("   -> Readiness...")
    createReadiness.main()
    
    print("   -> Trends...")
    createTrends.main()
    
    print("   -> Dashboard Widgets...")
    calculateHeatmaps.main()
    calculate_streaks.main()
    generate_plannedWorkouts.main()
    generate_top_cards.main()

    # STEP 3: Trends Analysis
    print("\n[STEP 3] Analyzing Trends...")
    analyze_trends.main()

    # STEP 4: Visuals
    print("\n[STEP 4] Updating Markdown...")
    update_visuals.main()

    # STEP 5: Git
    print("\n[STEP 5] Saving to Git...")
    git_ops.main()

    print("\n✅ SUCCESS")

if __name__ == "__main__":
    main()
