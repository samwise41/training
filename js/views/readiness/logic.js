// js/views/readiness/logic.js
import { parseDur, checkSport } from './utils.js';

export const getTrainingStats = (logData) => {
    let maxSwim = 0;
    let maxBike = 0;
    let maxRun = 0;
    let maxBikeElev = 0;

    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - 30);
    const safeLog = Array.isArray(logData) ? logData : [];

    safeLog.forEach(d => {
        // 1. Check Date
        const entryDate = new Date(d.date || d.Date);
        if (entryDate < lookbackDate) return;

        // 2. Get Duration (Handle numbers or strings)
        let dur = 0;
        if (typeof d.actualDuration === 'number') dur = d.actualDuration;
        else if (typeof d.duration === 'string') dur = parseDur(d.duration);
        else if (d.Duration) dur = parseDur(d.Duration); // Fallback

        // 3. Update Max Stats per Sport
        if (checkSport(d, 'SWIM')) {
            maxSwim = Math.max(maxSwim, dur);
        }
        else if (checkSport(d, 'BIKE')) {
            maxBike = Math.max(maxBike, dur);
            // Handle Elevation (Number or String with commas)
            let elev = d.elevationGain || d.ElevationGain || 0;
            if (typeof elev === 'string') elev = parseFloat(elev.replace(/,/g, ''));
            maxBikeElev = Math.max(maxBikeElev, elev || 0);
        }
        else if (checkSport(d, 'RUN')) {
            maxRun = Math.max(maxRun, dur);
        }
    });

    return { maxSwim, maxBike, maxRun, maxBikeElev };
};

// --- MD PARSER: Extracts Races from Markdown Plan ---
export const parseEvents = (planMd) => {
    if (!planMd || typeof planMd !== 'string') return [];
    
    const lines = planMd.split('\n');
    let inTable = false;
    let events = [];
    
    // Dynamic Column Mapping
    let colMap = {
        date: -1, name: -1, priority: -1, 
        swimGoal: -1, bikeGoal: -1, runGoal: -1, 
        elevGoal: -1 
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lowerLine = line.toLowerCase();
        
        // Header Detection (Must contain Date & Event Type)
        if (lowerLine.includes('|') && lowerLine.includes('date') && lowerLine.includes('event type')) { 
            inTable = true; 
            const headers = line.replace(/^\||\|$/g, '').split('|').map(h => h.trim().toLowerCase());
            
            headers.forEach((h, idx) => {
                if (h.includes('date')) colMap.date = idx;
                else if (h.includes('event type') || h.includes('race name')) colMap.name = idx;
                else if (h.includes('priority')) colMap.priority = idx;
                else if (h.includes('swim goal')) colMap.swimGoal = idx;
                else if (h.includes('bike goal')) colMap.bikeGoal = idx;
                else if (h.includes('run goal')) colMap.runGoal = idx;
                else if (h.includes('elevation') || h.includes('climb')) colMap.elevGoal = idx;
            });
            continue; 
        }

        if (inTable && line.startsWith('| :---')) continue; 

        if (inTable && line.startsWith('|')) {
            const cleanLine = line.replace(/^\||\|$/g, '');
            const cols = cleanLine.split('|').map(c => c.trim());
            
            if (cols.length >= 2 && colMap.date > -1) {
                events.push({
                    dateStr: cols[colMap.date],
                    name: cols[colMap.name],
                    priority: colMap.priority > -1 ? cols[colMap.priority] : 'C',
                    swimGoal: colMap.swimGoal > -1 ? cols[colMap.swimGoal] : '',
                    bikeGoal: colMap.bikeGoal > -1 ? cols[colMap.bikeGoal] : '',
                    runGoal:  colMap.runGoal > -1  ? cols[colMap.runGoal] : '',
                    bikeElevGoal: colMap.elevGoal > -1 ? cols[colMap.elevGoal] : '' 
                });
            }
        } else if (inTable && line === '') { 
            inTable = false; 
        }
    }

    // Sort and Filter Future Events
    const today = new Date();
    today.setHours(0,0,0,0);
    
    return events
        .filter(e => {
            const d = new Date(e.dateStr);
            return !isNaN(d.getTime()) && d >= today;
        })
        .sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr));
};
