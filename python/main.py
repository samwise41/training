import sys
import os
import subprocess

# Ensure we can import local modules
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
sys.path.append(SCRIPT_DIR)

# --- Strava Paths ---
STRAVA_DIR = os.path.join(ROOT_DIR, 'strava_data')
STRAVA_REQ_FILE = os.path.join(STRAVA_DIR, 'requirements.txt')
STRAVA_CYCLING_SCRIPT = os.path.join(STRAVA_DIR, 'cycling', 'process_cycling.py')
STRAVA_RUNNING_SCRIPT = os.path.join(STRAVA_DIR, 'running', 'process_running.py')

# --- Imports ---
from sync_modules import fetch_garmin, sync_database, analyze_trends, update_visuals, git_ops

# Import Generators (Wrap in try/except to avoid crashes if imports fail)
try:
    from zones import createZones
    from gear import createGear
    from readiness import createReadiness
    from dashboard import calculateHeatmaps, calculate_streaks, generate_plannedWorkouts, generate_top_cards
    from Trends import createTrends
except ImportError as e:
    print(f"⚠️ Import Warning: {e}")

def install_strava_requirements():
    """Installs dependencies for Strava scripts if requirements.txt exists."""
    if os.path.exists(STRAVA_REQ_FILE):
        print("   📦 Installing Strava dependencies...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", STRAVA_REQ_FILE])
        except subprocess.CalledProcessError:
            print("   ⚠️ Failed to install Strava dependencies.")

def main():
    print("🚀 STARTING DAILY TRAINING SYNC PIPELINE")
    
    # ==========================================
    # STEP 1: API FETCHING (Can be skipped!)
    # ==========================================
    if os.getenv("SKIP_GARMIN") == "true":
        print("\n⏭️ SKIP_GARMIN is active. Bypassing Garmin and Strava API fetches...")
        print("📂 Relying on existing local cache files for database rebuild.")
    else:
        # STEP 1: Garmin
        print("\n[STEP 1] Fetching Garmin...")
        try:
            fetch_garmin.main()
        except Exception as e:
            print(f"⚠️ Garmin Fetch Warning: {e}")

        # STEP 1.5: Strava (WITH FIX)
        print("\n[STEP 1.5] Syncing Strava...")
        
        # FIX: Install dependencies first!
        install_strava_requirements()
        
        # Now run the scripts
        if os.path.exists(STRAVA_CYCLING_SCRIPT):
            print("   🚴 Running Cycling Processor...")
            try:
                subprocess.run([sys.executable, STRAVA_CYCLING_SCRIPT], check=True)
            except subprocess.CalledProcessError as e:
                print(f"   ❌ Cycling Script Failed: {e}")

        if os.path.exists(STRAVA_RUNNING_SCRIPT):
            print("   🏃 Running Running Processor...")
            try:
                subprocess.run([sys.executable, STRAVA_RUNNING_SCRIPT], check=True)
            except subprocess.CalledProcessError as e:
                print(f"   ❌ Running Script Failed: {e}")

    # ==========================================
    # STEP 2-5: ALWAYS RUN (Rebuilds the App)
    # ==========================================
    
    # STEP 2: Database
    print("\n[STEP 2] Syncing Database...")
    try:
        sync_database.main()
    except Exception as e:
        print(f"❌ Database Sync Failed: {e}")
        return

    # STEP 2.5: Dashboard Generators
    print("\n[STEP 2.5] Generating Dashboard Tabs...")
    try:
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
    except Exception as e:
        print(f"⚠️ Dashboard Generation Warning: {e}")

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
