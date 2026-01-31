import os
import datetime
from fpdf import FPDF

# --- CONFIGURATION ---
OUTPUT_FILENAME = "full_codebase.pdf"  # Changed to .pdf

# File extensions to include
INCLUDE_EXTENSIONS = {'.js', '.css', '.html', '.json', '.py', '.md', '.yml', '.yaml'}

# Directories to ignore
EXCLUDE_DIRS = {
    '.git', '__pycache__', 'node_modules', 'dist', 'build', 'venv', 
    '.idea', '.vscode', 'notebook_lm'
}

# Specific filenames to ignore
EXCLUDE_FILES = {'package-lock.json', '.DS_Store'}

class CodePDF(FPDF):
    def header(self):
        self.set_font('Courier', 'B', 10)
        self.cell(0, 10, 'Project Codebase Export', align='C')
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Courier', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', align='C')

def combine_codebase():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, '..'))
    output_path = os.path.join(script_dir, OUTPUT_FILENAME)
    
    # Initialize PDF
    pdf = CodePDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Courier", size=9) # Monospace font is critical for code

    file_count = 0

    print(f"Scanning Project Root: {project_root}")

    try:
        # Add Title Page Info
        pdf.set_font("Courier", 'B', 12)
        pdf.cell(0, 10, f"Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", ln=True)
        pdf.ln(10)

        for current_root, dirs, files in os.walk(project_root):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

            for file in files:
                if file in EXCLUDE_FILES: continue
                _, ext = os.path.splitext(file)
                if ext.lower() not in INCLUDE_EXTENSIONS: continue

                file_path = os.path.join(current_root, file)
                relative_path = os.path.relpath(file_path, project_root)

                if file == os.path.basename(__file__) or file == OUTPUT_FILENAME: continue

                try:
                    with open(file_path, 'r', encoding='utf-8') as infile:
                        content = infile.read()
                        
                        # Add File Header
                        pdf.set_font("Courier", 'B', 10)
                        pdf.set_fill_color(230, 230, 230) # Light gray background for headers
                        pdf.cell(0, 8, txt=f"FILE: {relative_path}", ln=True, fill=True)
                        
                        # Add Code Content
                        pdf.set_font("Courier", size=8)
                        # multi_cell handles line wrapping automatically
                        # encode('latin-1', 'replace') handles emojis/special chars that break basic PDFs
                        safe_content = content.encode('latin-1', 'replace').decode('latin-1')
                        pdf.multi_cell(0, 4, txt=safe_content)
                        pdf.ln(5)
                        
                        file_count += 1
                        print(f"Added: {relative_path}")

                except Exception as e:
                    print(f"Skipping {relative_path}: {e}")

        pdf.output(output_path)
        print(f"Success! PDF generated at: {output_path}")

    except Exception as e:
        print(f"Critical Error: {e}")

if __name__ == "__main__":
    combine_codebase()
