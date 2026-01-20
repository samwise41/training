// js/parser.js

export const Parser = {
    // --- Helper: Get a section from Markdown text ---
    getSection: (md, header) => {
        if (!md || typeof md !== 'string') return "";
        const lines = md.split('\n');
        let inSection = false;
        let content = [];
        
        for (const line of lines) {
            // Flexible matching for headers (e.g. ## Header or ### Header)
            if (line.match(new RegExp(`^#{1,4}\\s+${header}`, 'i'))) {
                inSection = true;
                continue;
            }
            // Stop if we hit the next header of the same level
            if (inSection && line.startsWith('##')) {
                break; 
            }
            if (inSection) {
                content.push(line);
            }
        }
        return content.join('\n').trim();
    },

    // --- Helper: Parse a Markdown Table into an Array of Objects ---
    // This is the function that was missing
    _parseTableBlock: (markdownText) => {
        if (!markdownText) return [];
        
        const lines = markdownText.split('\n')
            .map(l => l.trim())
            .filter(l => l.startsWith('|'));

        if (lines.length < 3) return []; // Need headers, separator, and data

        // 1. Parse Headers
        const headerLine = lines[0];
        const headers = headerLine.split('|')
            .map(h => h.trim())
            .filter(h => h) // Remove empty first/last strings from split
            .map(h => h.replace(/\*\*/g, '').toLowerCase()); // Clean "**Day**" -> "day"

        // 2. Parse Rows
        const data = [];
        // Start at index 2 to skip Header (0) and Separator line (1)
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i];
            const cells = line.split('|').map(c => c.trim());
            
            // Remove empty matches from leading/trailing pipes
            // e.g. "| A | B |" splits to ["", "A", "B", ""]
            // We want ["A", "B"]
            const cleanCells = cells.slice(1, -1); 

            if (cleanCells.length === headers.length) {
                const rowObj = {};
                headers.forEach((header, index) => {
                    let value = cleanCells[index];
                    
                    // Specific keys that need parsing
                    if (header.includes('duration') || header.includes('plan') || header.includes('act')) {
                        // Extract number: "60 mins" -> 60
                        const num = parseInt(value.replace(/\D/g, ''));
                        value = isNaN(num) ? 0 : num;
                        
                        // Map standard keys for the dashboard
                        if (header.includes('planned duration')) header = 'plannedDuration';
                        if (header.includes('actual duration')) header = 'actualDuration';
                    }

                    // Map key names to standard expected format
                    if (header === 'planned workout') header = 'planned';
                    if (header === 'actual workout') header = 'actual';
                    
                    rowObj[header] = value;
                });
                
                // Only add valid rows
                if (rowObj.day) {
                    data.push(rowObj);
                }
            }
        }
        return data;
    },

    // --- MAIN: Parse Training Log ---
    parseTrainingLog: (data) => {
        // 1. JSON Array Support (The new standard)
        if (Array.isArray(data)) {
            return data.map(item => {
                const newItem = { ...item };
                
                // Convert String Dates to Date Objects
                if (newItem.date && typeof newItem.date === 'string') {
                    // Try standard date parse first
                    const d = new Date(newItem.date);
                    if (!isNaN(d)) {
                         newItem.date = d;
                    } else {
                        // Fallback for YYYY-MM-DD
                        const parts = newItem.date.split('-');
                        if (parts.length === 3) {
                            newItem.date = new Date(parts[0], parts[1] - 1, parts[2]);
                        }
                    }
                }

                // Ensure Numbers exist (prevent NaNs)
                newItem.plannedDuration = parseFloat(newItem.plannedDuration) || 0;
                newItem.actualDuration = parseFloat(newItem.actualDuration) || 0;
                newItem.RPE = parseFloat(newItem.RPE || newItem.rpe || 0);
                
                return newItem;
            });
        }

        // 2. Legacy String Support
        if (typeof data === 'string') {
            console.warn("Legacy Markdown Log detected.");
            return []; 
        }

        console.warn("Parser received unknown data format:", data);
        return [];
    }
};
