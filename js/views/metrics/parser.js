import { DataManager } from '../../utils/data.js';

// --- HELPER: Normalize Sport (The one update we keep) ---
const getSport = (d) => {
    // Check actualSport first (Training Log), then sport (Legacy)
    const raw = d.actualSport || d.sport || 'Other';
    const s = raw.toLowerCase();
    if (s.includes('cycl') || s.includes('ride') || s.includes('bike')) return 'Bike';
    if (s.includes('run') || s.includes('jog')) return 'Run';
    if (s.includes('swim') || s.includes('pool')) return 'Swim';
    return 'Other';
};

// --- HELPER: Week Aggregator (Restored Original Logic) ---
const aggregateWeekly = (data, valueKey) => {
    const weeks = {};
    data.forEach(d => {
        if (!d.date) return;
        const date = new Date(d.date);
        const day = date.getDay(); 
        // End of week = Saturday
        const diff = 6 - day; 
        const weekEnd = new Date(date);
        weekEnd.setDate(date.getDate() + diff);
        weekEnd.setHours(0,0,0,0);
        
        const key = weekEnd.toISOString().split('T')[0];
        if (!weeks[key]) weeks[key] = 0;
        
        // Sum values (handling missing data safely)
        weeks[key] += (d[valueKey] || 0);
    });

    return Object.keys(weeks).map(k => ({
        date: new Date(k),
        dateStr: k,
        val: weeks[k],
        name: 'Week Ending ' + k
    })).sort((a,b) => a.date - b.date);
};

// --- MAIN EXPORT: Normalize (Lightweight) ---
export const normalizeMetricsData = (data) => {
    // Just date sorting and basic cleaning. 
    // We do NOT pre-calculate metrics here anymore to avoid bugs.
    if (!data) return [];
    return data
        .map(d => ({...d, dateObj: new Date(d.date)}))
        .sort((a,b) => a.dateObj - b.dateObj);
};

// --- MAIN EXPORT: Extract Data (Restored Calculation Logic) ---
export const extractMetricData = (data, key) => {
    if (!data) return [];

    // 1. Weekly Charts (TSS / Calories)
    if (key === 'tss') return aggregateWeekly(data, 'trainingStressScore');
    if (key === 'calories') return aggregateWeekly(data, 'calories');

    // 2. Balance Chart
    if (key === 'training_balance') {
        return data.filter(d => d.zones).map(d => ({
            date: new Date(d.date),
            dateStr: d.date,
            name: d.title,
            distribution: d.zones,
            val: 0
        }));
    }

    // 3. Feeling Chart
    if (key === 'feeling_load') {
        return data.filter(d => d.trainingStressScore > 0 || d.Feeling).map(d => ({
            date: new Date(d.date),
            dateStr: d.date,
            name: d.title,
            load: d.trainingStressScore || 0,
            feeling: d.Feeling || null,
            val: d.trainingStressScore || 0
        }));
    }

    // 4. Standard Metrics (Calculated On-The-Fly)
    return data
        .filter(d => {
            const sport = getSport(d);

            // Sport Filters
            if (['subjective_bike','endurance','strength'].includes(key) && sport !== 'Bike') return false;
            if (['subjective_run','run','mechanical','gct','vert'].includes(key) && sport !== 'Run') return false;
            if (['subjective_swim','swim'].includes(key) && sport !== 'Swim') return false;

            // Value Logic (The "Original" Math)
            let val = null;
            
            // --- General ---
            if (key === 'vo2max') val = d.vO2MaxValue;
            if (key === 'anaerobic') val = d.anaerobicTrainingEffect;

            // --- Bike ---
            if (key === 'subjective_bike' && d.avgPower && d.RPE) val = d.avgPower / d.RPE;
            if (key === 'endurance' && d.avgPower && d.averageHR) val = d.avgPower / d.averageHR;
            if (key === 'strength' && d.avgPower && d.averageBikingCadenceInRevPerMinute) val = d.avgPower / d.averageBikingCadenceInRevPerMinute;

            // --- Run ---
            if (key === 'subjective_run' && d.averageSpeed && d.RPE) val = d.averageSpeed / d.RPE;
            if (key === 'run' && d.averageSpeed && d.averageHR) val = (d.averageSpeed * 60) / d.averageHR;
            if (key === 'mechanical' && d.avgVerticalOscillation && d.avgGroundContactTime) val = (d.avgVerticalOscillation / d.avgGroundContactTime) * 100;
            if (key === 'gct') val = d.avgGroundContactTime;
            if (key === 'vert') val = d.avgVerticalOscillation;

            // --- Swim ---
            if (key === 'subjective_swim' && d.averageSpeed && d.RPE) val = d.averageSpeed / d.RPE;
            if (key === 'swim' && d.averageSpeed && d.averageHR) val = (d.averageSpeed * 60) / d.averageHR;

            // Validation
            if (val === null || val === undefined || !isFinite(val) || val === 0) return false;

            // Attach to object for mapping
            d._tempVal = val;
            return true;
        })
        .map(d => ({
            date: new Date(d.date),
            dateStr: d.date,
            name: d.title || 'Workout',
            val: d._tempVal, // Use the value calculated in the filter
            breakdown: ''
        }));
};

// Legacy support
export const calculateSubjectiveEfficiency = (data, type) => {
    return extractMetricData(data, `subjective_${type}`);
};
