import subprocess
import os
from datetime import datetime
from . import config

def run_cmd(args):
    try:
        # Capture output to debug if needed
        subprocess.run(args, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except subprocess.CalledProcessError as e:
        print(f"Git Error: {e.stderr.decode().strip()}")
        # We don't raise here so the main script doesn't crash if git fails slightly
        pass

def main():
    # 1. Check Directory
    if not os.path.exists(os.path.join(config.BASE_DIR, '.git')):
        print("   -> Not a git repository. Skipping.")
        return

    # 2. Configure Git Identity
    print("   -> Configuring Git Identity...")
    try:
        run_cmd(["git", "config", "user.email", "github-actions@github.com"])
        run_cmd(["git", "config", "user.name", "github-actions"])
    except Exception:
        pass 

    # 3. Add Files (THE FIX)
    print("   -> Staging files...")
    
    # Define paths relative to BASE_DIR
    data_folder = os.path.join(config.BASE_DIR, 'data')
    garmin_folder = os.path.join(config.BASE_DIR, 'garmin_data') # <--- ADDED
    strava_folder = os.path.join(config.BASE_DIR, 'strava_data')
    plan_file = os.path.join(config.BASE_DIR, 'endurance_plan.md')

    paths_to_add = [data_folder, plan_file]
    
    # Add optional folders if they exist
    if os.path.exists(garmin_folder):
        paths_to_add.append(garmin_folder) # <--- ADDED
        
    if os.path.exists(strava_folder):
        paths_to_add.append(strava_folder)

    # Run the add command
    if paths_to_add:
        # We use standard strings here to avoid path issues
        cmd = ["git", "add"] + paths_to_add
        run_cmd(cmd)

    # 4. Check Status
    status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True).stdout
    if not status.strip():
        print("   -> No changes to commit.")
        return

    # 5. Commit
    msg = f"Auto-Update: Training & Health Data {datetime.now().strftime('%Y-%m-%d')}"
    print(f"   -> Committing: {msg}")
    run_cmd(["git", "commit", "-m", msg])

    # 6. Sync
    print("   -> Pulling (rebase)...")
    try:
        run_cmd(["git", "pull", "--rebase"])
    except Exception:
        print("   -> Rebase failed. Trying standard pull...")
        try:
            run_cmd(["git", "pull"])
        except Exception:
            pass # Continue to push
    
    print("   -> Pushing...")
    run_cmd(["git", "push"])
    print("   -> Git Sync Success.")

if __name__ == "__main__":
    main()
