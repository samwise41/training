// js/views/readiness/logic.js
import { parseDur } from './utils.js';

export const getTrainingStats = (mergedLogData) => {
    let maxSwim = 0;
    let maxBike = 0;
    let maxRun = 0;
    let maxBikeElev = 0;

    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - 30);
    const safeLog = Array.isArray(mergedLogData) ? mergedLogData : [];

    safeLog.forEach(d => {
        const entryDate = new Date(d.date);
        if (entryDate >= lookbackDate) {
            let dur = 0;
            if (typeof d.actualDuration === 'number') dur = d.actualDuration;
            else if (typeof d.duration === 'string') dur = parseDur(d.duration);
            
            if (d.type === 'Swim') maxSwim = Math.max(maxSwim, dur);
            if (d.type === 'Bike') {
                maxBike = Math.max(maxBike, dur);
                // Ensure elevationGain exists, default to 0
                maxBikeElev = Math.max(maxBikeElev, d.elevationGain || 0);
            }
            if (d.type === 'Run') maxRun = Math.max(maxRun, dur);
        }
    });

    return { maxSwim, maxBike, maxRun, maxBikeElev };
};

export const parseEvents = (planMd) => {
    if (!planMd) return [];
    
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
        
        // STRICTER CHECK: Must contain "Date" AND "Event Type" to avoid grabbing the Weekly Schedule
        if (lowerLine.includes('| **date** |') && lowerLine.includes('event type')) { 
            inTable = true; 
            const headers = line.replace(/^\||\|$/g, '').split('|').map(h => h.trim().toLowerCase());
            
            headers.forEach((h, idx) => {
                if (h.includes('date')) colMap.date = idx;
                else if (h.includes('event type')) colMap.name = idx;
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

    events.sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr));
    const today = new Date();
    today.setHours(0,0,0,0);
    
    return events.filter(e => {
        const d = new Date(e.dateStr);
        return !isNaN(d.getTime()) && d >= today;
    });
};
