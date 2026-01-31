import os
import datetime

# --- CONFIGURATION ---
OUTPUT_FILENAME = "full_codebase.txt"

# File extensions to include (add/remove as needed)
INCLUDE_EXTENSIONS = {'.js', '.css', '.html', '.json', '.py', '.md'}

# Directories to ignore
EXCLUDE_DIRS = {
    '.git', 
    '__pycache__', 
    'node_modules', 
    'dist', 
    'build', 
    'venv', 
    '.idea', 
    '.vscode',
    'notebook_lm' # Don't scan the folder we are outputting to
}

# Specific filenames to ignore
EXCLUDE_FILES = {
    'package-lock.json', 
    '.DS_Store'
}

def combine_codebase():
    # 1. Determine locations based on where this script lives
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # The "Project Root" is one level up from this script
    project_root = os.path.abspath(os.path.join(script_dir, '..'))
    
    # The output file goes in the SAME folder as this script
    output_path = os.path.join(script_dir, OUTPUT_FILENAME)
    
    file_count = 0
    total_lines = 0

    print(f"Script location: {script_dir}")
    print(f"Scanning Project Root: {project_root}")
    print(f"Output target: {output_path}")
    print("-" * 30)

    try:
        with open(output_path, 'w', encoding='utf-8') as outfile:
            # Add a header with timestamp
            outfile.write(f"PROJECT CODEBASE EXPORT\n")
            outfile.write(f"Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            outfile.write("=" * 60 + "\n\n")

            # Walk through the project root
            for current_root, dirs, files in os.walk(project_root):
                # Modify 'dirs' in-place to ignore specific folders
                dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

                for file in files:
                    if file in EXCLUDE_FILES:
                        continue

                    _, ext = os.path.splitext(file)
                    if ext.lower() not in INCLUDE_EXTENSIONS:
                        continue

                    file_path = os.path.join(current_root, file)
                    
                    # Create a relative path for cleaner reading (e.g., "js/views/metrics/charts.js")
                    relative_path = os.path.relpath(file_path, project_root)

                    # Skip this script itself and the output file
                    if file == os.path.basename(__file__) or file == OUTPUT_FILENAME:
                        continue

                    try:
                        with open(file_path, 'r', encoding='utf-8') as infile:
                            content = infile.read()
                            
                            # Write clear separators
                            outfile.write(f"\n\n{'='*60}\n")
                            outfile.write(f"START FILE: {relative_path}\n")
                            outfile.write(f"{'='*60}\n")
                            outfile.write(content)
                            outfile.write(f"\n\n--- END FILE: {relative_path} ---\n")
                            
                            file_count += 1
                            total_lines += content.count('\n') + 1

                    except Exception as e:
                        print(f"Skipping {relative_path}: {e}")

        print(f"Success! Combined {file_count} files.")
        print(f"Saved to: {output_path}")

    except Exception as e:
        print(f"Critical Error: {e}")

if __name__ == "__main__":
    combine_codebase()
