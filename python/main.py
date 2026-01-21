import sys
import os
import time

# Ensure we can import local modules
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(SCRIPT_DIR)

# --- Existing Imports ---
from sync_modules import fetch_garmin, sync_database, analyze_trends, update_visuals, git_ops

# --- New Generator Imports ---
# We wrap these in try/except to prevent the whole pipeline from crashing if one script fails
try:
    from zones import createZones
    from gear import createGear
    from readiness import createReadiness
    from Trends import createTrends
    from dashboard import calculateHeatmaps, calculate_streaks, generate_plannedWorkouts, generate_top_cards
except ImportError as e:
    print(f"⚠️ Import Warning: {e}")

def main():
    print("🚀 STARTING DAILY TRAINING SYNC PIPELINE")
    print("==================================================")

    # STEP 1: Fetch from Garmin
    print("\n[STEP 1] Fetching Data from Garmin...")
    try:
        fetch_garmin.main()
    except Exception as e:
        print(f"⚠️ Garmin Fetch Warning (Non-blocking): {e}")

    # STEP 2: Database Synchronization
    print("\n[STEP 2] Syncing Databases (Plan + Actuals)...")
    try:
        sync_database.main()
    except Exception as e:
        print(f"❌ Database Sync Failed: {e}")
        return 

    # STEP 2.5: Generate Dashboard Data (The Missing Link)
    print("\n[STEP 2.5] Generating Dashboard & Tab Data...")
    try:
        print("   -> Running Zones...")
        createZones.main()
        
        print("   -> Running Gear...")
        createGear.main()
        
        print("   -> Running Readiness...")
        createReadiness.main()
        
        print("   -> Running Trends...")
        createTrends.main()
        
        print("   -> Running Dashboard Widgets (Heatmaps, Streaks, Workouts, Cards)...")
        calculateHeatmaps.main()
        calculate_streaks.main()
        generate_plannedWorkouts.main()
        generate_top_cards.main()
        
    except Exception as e:
        print(f"⚠️ Dashboard Generation Warning: {e}")

    # STEP 3: Analyze Trends
    print("\n[STEP 3] Analyzing Trends & Generating Briefing...")
    try:
        analyze_trends.main()
    except Exception as e:
        print(f"⚠️ Analysis Warning: {e}")

    # STEP 4: Update Visuals
    print("\n[STEP 4] Updating Endurance Plan Markdown...")
    try:
        update_visuals.main()
    except Exception as e:
        print(f"⚠️ Visuals Update Warning: {e}")

    # STEP 5: Git Operations
    print("\n[STEP 5] Saving to Git...")
    try:
        git_ops.main()
    except Exception as e:
        print(f"⚠️ Git Warning: {e}")

    print("\n==================================================")
    print("✅ PIPELINE COMPLETE")

if __name__ == "__main__":
    main()
