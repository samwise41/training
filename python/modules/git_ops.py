import subprocess
import os
from datetime import datetime
from . import config

def push_changes():
    print("\n🐙 GIT: Starting Commit & Push...")
    
    # 1. Verify files exist
    files_to_add = [
        config.MASTER_DB, 
        config.PLAN_FILE, 
        config.GARMIN_JSON, 
        config.BRIEF_FILE
    ]
    
    valid_files = [f for f in files_to_add if os.path.exists(f)]
    
    if not valid_files:
        print("❌ No files found to commit.")
        return

    try:
        # 2. Configure Git (Safe for CI/CD)
        subprocess.run(["git", "config", "user.name", "github-actions"], check=False)
        subprocess.run(["git", "config", "user.email", "github-actions@github.com"], check=False)

        # 3. Add Files
        cmd_add = ["git", "add"] + valid_files
        subprocess.run(cmd_add, check=True)
        
        # 4. Check Status
        status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True).stdout
        
        if status:
            print(f"   Changes detected in: {[os.path.basename(f) for f in valid_files]}")
            
            # 5. Commit
            msg = f"Auto-Update: Training Data {datetime.now().strftime('%Y-%m-%d %H:%M')}"
            subprocess.run(["git", "commit", "-m", msg], check=True)
            
            # 6. Rebase & Push
            subprocess.run(["git", "pull", "--rebase"], check=True)
            subprocess.run(["git", "push"], check=True)
            print("✅ Git Push Complete!")
        else:
            print("ℹ️  No changes to commit.")
            
    except Exception as e:
        print(f"⚠️ Git Operation Failed: {e}")
