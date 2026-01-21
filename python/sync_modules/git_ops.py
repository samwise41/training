import subprocess
import os
from datetime import datetime
from . import config

def run_cmd(args):
    try:
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
        print(f"   -> Warning: Could not set git config: {e}")

    # 3. Add Files
    print("   -> Staging files...")
    
    # FIX: Add the ENTIRE data directory + Plan Markdown
    paths_to_add = ["data", "endurance_plan.md"]
    
    valid_paths = []
    for p in paths_to_add:
        full_p = os.path.join(config.BASE_DIR, p)
        if os.path.exists(full_p):
            valid_paths.append(full_p)
    
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

    # 6. Sync
    print("   -> Pulling (rebase)...")
    try:
        run_cmd(["git", "pull", "--rebase"])
    except Exception:
        print("   -> Rebase failed. Trying standard pull...")
        try:
            run_cmd(["git", "pull"])
        except Exception:
            pass 
    
    print("   -> Pushing...")
    run_cmd(["git", "push"])
    print("   -> Git Sync Success.")

if __name__ == "__main__":
    main()
