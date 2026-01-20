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
        // 1. Parse Date safely
        const entryDate = new Date(d.date);
        if (isNaN(entryDate) || entryDate < lookbackDate) return;

        // 2. Strict Duration Check (from your fields list)
        let dur = 0;
        if (typeof d.actualDuration === 'number') {
            dur = d.actualDuration;
        } else if (d.duration) {
            dur = parseDur(d.duration);
        }

        // 3. Strict Sport Check (using utils.js)
        if (checkSport(d, 'SWIM')) {
            maxSwim = Math.max(maxSwim, dur);
        }
        else if (checkSport(d, 'BIKE')) {
            maxBike = Math.max(maxBike, dur);
            
            // Strict Elevation Check
            let elev = 0;
            if (d.elevationGain) {
                // Remove commas if string (e.g. "1,200")
                elev = parseFloat(String(d.elevationGain).replace(/,/g, ''));
            }
            if (!isNaN(elev)) maxBikeElev = Math.max(maxBikeElev, elev);
        }
        else if (checkSport(d, 'RUN')) {
            maxRun = Math.max(maxRun, dur);
        }
    });

    return { maxSwim, maxBike, maxRun, maxBikeElev };
};

export const parseEvents = (planMd) => {
    if (!planMd || typeof planMd !== 'string') return [];
    
    const lines = planMd.split('\n');
    let inTable = false;
    let events = [];
    
    let colMap = { date: -1, name: -1, priority: -1, swimGoal: -1, bikeGoal: -1, runGoal: -1, elevGoal: -1 };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lowerLine = line.toLowerCase();
        
        // Scan for Race Table Header
        if (lowerLine.includes('|') && lowerLine.includes('date') && (lowerLine.includes('event') || lowerLine.includes('race'))) { 
            inTable = true; 
            const headers = line.replace(/^\||\|$/g, '').split('|').map(h => h.trim().toLowerCase());
            
            headers.forEach((h, idx) => {
                if (h.includes('date')) colMap.date = idx;
                else if (h.includes('event') || h.includes('race')) colMap.name = idx;
                else if (h.includes('priority')) colMap.priority = idx;
                else if (h.includes('swim')) colMap.swimGoal = idx;
                else if (h.includes('bike')) colMap.bikeGoal = idx;
                else if (h.includes('run')) colMap.runGoal = idx;
                else if (h.includes('elev') || h.includes('climb')) colMap.elevGoal = idx;
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

    const today = new Date();
    today.setHours(0,0,0,0);
    
    return events
        .filter(e => {
            const d = new Date(e.dateStr);
            return !isNaN(d.getTime()) && d >= today;
        })
        .sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr));
};
