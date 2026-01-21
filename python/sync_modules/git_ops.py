import subprocess
import os
from datetime import datetime
from . import config

def run_cmd(args):
    try:
        # Run command and capture output for error reporting
        subprocess.run(args, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except subprocess.CalledProcessError as e:
        print(f"Git Error: {e.stderr.decode().strip()}")
        raise e

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
    except Exception as e:
        print(f"   -> Warning: Could not set git config (might already be set): {e}")

    # 3. Add Files
    print("   -> Staging files...")
    
    # FIX: Add the ENTIRE data directory to capture all subfolders (dashboard, readiness, etc.)
    # Also add strava_data if it exists to capture those updates too.
    paths_to_add = [
        config.DATA_DIR,         # Catch-all for data/ (trends, gear, dashboard, etc.)
        config.PLAN_MARKDOWN     # The endurance_plan.md file
    ]
    
    # Optional: Add strava_data if it exists (for the power/pace curves)
    strava_dir = os.path.join(config.BASE_DIR, 'strava_data')
    if os.path.exists(strava_dir):
        paths_to_add.append(strava_dir)

    # Filter for paths that actually exist
    valid_paths = [p for p in paths_to_add if os.path.exists(p)]
    
    if valid_paths:
        cmd = ["git", "add"] + valid_paths
        run_cmd(cmd)

    # 4. Check Status
    status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True).stdout
    if not status.strip():
        print("   -> No changes to commit.")
        return

    # 5. Commit
    msg = f"Auto-Update: Training Data {datetime.now().strftime('%Y-%m-%d')}"
    print(f"   -> Committing: {msg}")
    run_cmd(["git", "commit", "-m", msg])

    # 6. Sync (Pull Rebase -> Push)
    print("   -> Pulling (rebase)...")
    try:
        run_cmd(["git", "pull", "--rebase"])
    except Exception:
        print("   -> Rebase failed/conflict. Trying standard pull...")
        try:
            run_cmd(["git", "pull"])
        except Exception as e:
            print(f"   -> Standard pull failed: {e}")
            # We continue to try pushing even if pull failed, though it might reject.

    print("   -> Pushing...")
    run_cmd(["git", "push"])
    print("   -> Git Sync Success.")

if __name__ == "__main__":
    main()
