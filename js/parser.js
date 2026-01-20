// js/parser.js

export const Parser = {
    // --- Helper: Get a section from Markdown text ---
    getSection: (md, header) => {
        if (!md || typeof md !== 'string') return "";
        const lines = md.split('\n');
        let inSection = false;
        let content = [];
        
        for (const line of lines) {
            if (line.startsWith('##') && line.includes(header)) {
                inSection = true;
                continue;
            }
            if (inSection && line.startsWith('##')) {
                break; 
            }
            if (inSection) {
                content.push(line);
            }
        }
        return content.join('\n').trim();
    },

    // --- MAIN: Parse Training Log ---
    // FIXED: Detects if data is JSON (Array) or Markdown (String)
    parseTrainingLog: (data) => {
        // 1. If it's already an array (JSON from training_log.json), just clean dates
        if (Array.isArray(data)) {
            return data.map(item => {
                const newItem = { ...item };
                
                // Convert String Dates to Objects
                if (newItem.date && typeof newItem.date === 'string') {
                    const parts = newItem.date.split('-');
                    if (parts.length === 3) {
                        newItem.date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    } else {
                        newItem.date = new Date(newItem.date);
                    }
                }

                // Ensure Numbers
                newItem.plannedDuration = parseFloat(newItem.plannedDuration) || 0;
                newItem.actualDuration = parseFloat(newItem.actualDuration) || 0;
                newItem.RPE = parseFloat(newItem.RPE || newItem.rpe || 0);
                
                return newItem;
            });
        }

        // 2. Fallback for Strings (Legacy Support)
        if (typeof data === 'string') {
            console.warn("Legacy Markdown Log detected.");
            return []; 
        }

        console.warn("Parser received unknown data format:", data);
        return [];
    }
};
