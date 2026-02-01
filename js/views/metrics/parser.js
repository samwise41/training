import { DataManager } from '../../utils/data.js';

// --- HELPER: Week Aggregator ---
// Sums daily values into Weekly buckets (Ending Saturday)
const aggregateWeekly = (data, valueKey) => {
    const weeks = {};
    
    data.forEach(d => {
        if (!d.date) return;
        
        // Calculate Week Ending Saturday
        const date = new Date(d.date);
        const day = date.getDay(); // 0=Sun, 6=Sat
        // If 0 (Sun), add 6 days to get Sat. If 6 (Sat), add 0.
        const diff = 6 - day; 
        const weekEnd = new Date(date);
        weekEnd.setDate(date.getDate() + diff);
        weekEnd.setHours(0,0,0,0);
        
        const key = weekEnd.toISOString().split('T')[0];
        
        if (!weeks[key]) weeks[key] = 0;
        weeks[key] += (d[valueKey] || 0);
    });

    return Object.keys(weeks).map(k => ({
        date: new Date(k),
        dateStr: k,
        val: weeks[k], // The summed value (TSS or Calories)
        name: 'Week Ending ' + k,
        breakdown: ''
    })).sort((a,b) => a.date - b.date);
};

// --- MAIN NORMALIZER ---
export const normalizeMetricsData = (data) => {
    if (!data || !Array.isArray(data)) return [];

    return data.map(d => {
        if (!d.date) return null;

        // 1. Sport Mapping
        const sourceSport = d.actualSport || d.sport || 'Other';
        let cleanSport = sourceSport;
        if (sourceSport === 'Ride' || sourceSport === 'Cycling') cleanSport = 'Bike';
        if (sourceSport === 'Running') cleanSport = 'Run';
        if (sourceSport === 'Swimming') cleanSport = 'Swim';

        // 2. Durations & Basics
        const dur = (d.durationInSeconds || d.duration || 0) / 60;
        
        // 3. Construct Object (NO FILTERS HERE - Keep all data)
        return {
            date: new Date(d.date),
            dateStr: d.date,
            name: d.title || 'Workout',
            sport: cleanSport,
            duration: dur,
            
            // Raw Metrics
            avgPower: d.avgPower,
            averageHR: d.averageHR,
            averageSpeed: d.averageSpeed,
            RPE: d.RPE,
            cadence: d.averageBikingCadenceInRevPerMinute,
            vert: d.avgVerticalOscillation,
            gct: d.avgGroundContactTime,
            
            // Aggregation Targets
            tss: d.trainingStressScore || 0,
            calories: d.calories || 0,
            
            // Special Charts Data
            zones: d.zones || null,
            feeling: d.Feeling || null,
            load: d.trainingStressScore || 0
        };
    }).filter(d => d !== null).sort((a,b) => a.date - b.date);
};

// --- CHART DATA EXTRACTOR ---
export const extractMetricData = (data, key) => {
    if (!data) return [];

    // --- CASE 1: Weekly Aggregations (TSS / Calories) ---
    if (key === 'tss') return aggregateWeekly(data, 'tss');
    if (key === 'calories') return aggregateWeekly(data, 'calories');

    // --- CASE 2: Special Charts ---
    
    // Balance Chart
    if (key === 'training_balance') {
        return data
            .filter(d => d.zones) // Must have zones
            .map(d => ({
                date: d.date, 
                dateStr: d.dateStr, 
                name: d.name,
                distribution: d.zones, // Pass the zones object directly
                val: 0 // Placeholder value
            }));
    }

    // Feeling vs Load
    if (key === 'feeling_load') {
        return data
            .filter(d => d.load > 0 || d.feeling != null)
            .map(d => ({
                date: d.date, 
                dateStr: d.dateStr, 
                name: d.name,
                load: d.load,
                feeling: d.feeling,
                val: d.load // Use load as the primary 'val' for scaling
            }));
    }

    // --- CASE 3: Standard Metrics (Calculated on the fly) ---
    let reqSport = null;
    if (['subjective_bike','endurance','strength'].includes(key)) reqSport = 'Bike';
    if (['subjective_run','run','mechanical','gct','vert'].includes(key)) reqSport = 'Run';
    if (['subjective_swim','swim'].includes(key)) reqSport = 'Swim';

    return data
        .filter(d => {
            // Sport Filter
            if (reqSport && d.sport !== reqSport) return false;
            
            // Value Calculation & Check
            let val = 0;
            if (key === 'vo2max') val = d.vo2max; 
            else if (key === 'anaerobic') val = d.anaerobic;
            
            else if (key === 'subjective_bike') val = (d.avgPower && d.RPE) ? d.avgPower/d.RPE : 0;
            else if (key === 'endurance') val = (d.avgPower && d.averageHR) ? d.avgPower/d.averageHR : 0;
            else if (key === 'strength') val = (d.avgPower && d.cadence) ? d.avgPower/d.cadence : 0;
            
            else if (key === 'subjective_run') val = (d.averageSpeed && d.RPE) ? d.averageSpeed/d.RPE : 0;
            else if (key === 'run') val = (d.averageSpeed && d.averageHR) ? (d.averageSpeed*60)/d.averageHR : 0;
            else if (key === 'mechanical') val = (d.vert && d.gct) ? (d.vert/d.gct)*100 : 0;
            else if (key === 'gct') val = d.gct;
            else if (key === 'vert') val = d.vert;
            
            else if (key === 'subjective_swim') val = (d.averageSpeed && d.RPE) ? d.averageSpeed/d.RPE : 0;
            else if (key === 'swim') val = (d.averageSpeed && d.averageHR) ? (d.averageSpeed*60)/d.averageHR : 0;

            // Must be valid number
            return val !== 0 && isFinite(val);
        })
        .map(d => {
            // Recalculate for final object (Clean Map)
            let val = 0;
            if (key === 'subjective_bike') val = d.avgPower/d.RPE;
            else if (key === 'endurance') val = d.avgPower/d.averageHR;
            else if (key === 'strength') val = d.avgPower/d.cadence;
            else if (key === 'subjective_run') val = d.averageSpeed/d.RPE;
            else if (key === 'run') val = (d.averageSpeed*60)/d.averageHR;
            else if (key === 'mechanical') val = (d.vert/d.gct)*100;
            else if (key === 'gct') val = d.gct;
            else if (key === 'vert') val = d.vert;
            else if (key === 'subjective_swim') val = d.averageSpeed/d.RPE;
            else if (key === 'swim') val = (d.averageSpeed*60)/d.averageHR;
            else if (key === 'vo2max') val = d.vo2max;
            else if (key === 'anaerobic') val = d.anaerobic;

            return {
                date: d.date,
                dateStr: d.dateStr,
                name: d.name,
                val: val,
                breakdown: ''
            };
        });
};

export const calculateSubjectiveEfficiency = (data, type) => {
    return extractMetricData(data, `subjective_${type}`);
};
