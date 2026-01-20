// js/views/metrics/parser.js
import { checkSport } from './utils.js';

export const METRIC_FORMULAS = {
    'subjective_bike': '(Avg Power / RPE)',
    'subjective_run': '(Avg Speed / RPE)',
    'subjective_swim': '(Avg Speed / RPE)',
    'endurance': '(Norm Power / Avg HR)',
    'strength': '(Torque / Output)',
    'run': '(Avg Power / Avg Speed)',
    'swim': '(Avg Speed / Stroke Rate)',
    'mechanical': '(Vert Osc / GCT)'
};

// --- Helper: Direct Data Access ---
// We check the exact field names found in your JSON
const getVal = (item, keys) => {
    for (const k of keys) {
        if (item[k] !== undefined && item[k] !== null && item[k] !== "") {
            const v = parseFloat(item[k]);
            if (!isNaN(v)) return v;
        }
    }
    return 0;
};

// --- DATA EXTRACTORS ---

export const aggregateWeeklyTSS = (data) => {
    const weeks = {};
    data.forEach(d => {
        // Check standard TSS field names
        const tss = getVal(d, ['trainingStressScore', 'tss', 'TSS']);
        if (tss <= 0) return;
        
        const date = new Date(d.date);
        const day = date.getDay(); 
        const diff = date.getDate() - day + (day === 0 ? 0 : 7); 
        const weekEnd = new Date(date.setDate(diff));
        weekEnd.setHours(0,0,0,0);
        const key = weekEnd.toISOString().split('T')[0];
        
        if (!weeks[key]) weeks[key] = 0;
        weeks[key] += tss;
    });
    
    return Object.keys(weeks).sort().map(k => ({
        date: new Date(k),
        dateStr: `Week Ending ${k}`,
        name: "Weekly Load",
        val: weeks[k],
        breakdown: `Total TSS: ${Math.round(weeks[k])}`
    }));
};

export const extractMetricData = (data, key) => {
    switch(key) {
        // --- CYCLING ---
        case 'endurance': 
            return data.filter(x => checkSport(x, 'BIKE')).map(x => {
                const pwr = getVal(x, ['avgPower', 'AvgPower']);
                const hr = getVal(x, ['avgHR', 'AvgHR', 'averageHeartRate']);
                if (pwr > 0 && hr > 0) 
                    return { val: pwr / hr, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `Pwr:${Math.round(pwr)} / HR:${Math.round(hr)}` };
            }).filter(Boolean);

        case 'strength': 
            return data.filter(x => checkSport(x, 'BIKE')).map(x => {
                const pwr = getVal(x, ['avgPower', 'AvgPower']);
                const cad = getVal(x, ['avgCadence', 'AvgCadence']);
                if (pwr > 0 && cad > 0) 
                    return { val: pwr / cad, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `Pwr:${Math.round(pwr)} / RPM:${Math.round(cad)}` };
            }).filter(Boolean);
        
        // --- RUNNING ---
        case 'run': 
            return data.filter(x => checkSport(x, 'RUN')).map(x => {
                const spd = getVal(x, ['avgSpeed', 'AvgSpeed']);
                const hr = getVal(x, ['avgHR', 'AvgHR', 'averageHeartRate']);
                if (spd > 0 && hr > 0) 
                    return { val: (spd * 60) / hr, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `Pace:${Math.round(spd*60)}m/m / HR:${Math.round(hr)}` };
            }).filter(Boolean);

        case 'mechanical': 
            return data.filter(x => checkSport(x, 'RUN')).map(x => {
                const spd = getVal(x, ['avgSpeed', 'AvgSpeed']);
                const pwr = getVal(x, ['avgPower', 'AvgPower']);
                if (spd > 0 && pwr > 0) 
                    return { val: (spd * 100) / pwr, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `Spd:${spd.toFixed(1)} / Pwr:${Math.round(pwr)}` };
            }).filter(Boolean);

        case 'gct': 
            return data.filter(x => checkSport(x, 'RUN')).map(x => {
                const v = getVal(x, ['avgGroundContactTime', 'AvgGroundContactTime']);
                if (v > 0) return { val: v, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `${Math.round(v)} ms` };
            }).filter(Boolean);

        case 'vert': 
            return data.filter(x => checkSport(x, 'RUN')).map(x => {
                const v = getVal(x, ['avgVerticalOscillation', 'AvgVerticalOscillation']);
                if (v > 0) return { val: v, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `${v.toFixed(1)} cm` };
            }).filter(Boolean);
        
        // --- SWIMMING ---
        case 'swim': 
            return data.filter(x => checkSport(x, 'SWIM')).map(x => {
                const spd = getVal(x, ['avgSpeed', 'AvgSpeed']);
                const hr = getVal(x, ['avgHR', 'AvgHR', 'averageHeartRate']);
                if (spd > 0 && hr > 0) 
                    return { val: (spd * 60) / hr, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `Spd:${(spd*60).toFixed(1)}m/m / HR:${Math.round(hr)}` };
            }).filter(Boolean);
        
        // --- GENERAL ---
        case 'vo2max': 
            return data.map(x => {
                const v = getVal(x, ['vO2MaxValue', 'VO2Max', 'vo2Max']);
                if (v > 0) return { val: v, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: "VO2 Est", breakdown: `Score: ${v}` };
            }).filter(Boolean);

        case 'anaerobic': 
            return data.map(x => {
                const v = getVal(x, ['anaerobicTrainingEffect', 'AnaerobicEffect']);
                if (v > 0.5) return { val: v, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `Anaerobic: ${v}` };
            }).filter(Boolean);

        case 'tss': return aggregateWeeklyTSS(data);
        default: return [];
    }
};

export const calculateSubjectiveEfficiency = (allData, sportMode) => {
    return allData.map(d => {
        const rpe = getVal(d, ['RPE', 'rpe']);
        if (rpe <= 0) return null;
        
        let val = 0, breakdown = "", match = false;

        // Check Sport + Fields
        if (sportMode === 'bike' && checkSport(d, 'BIKE')) {
            const pwr = getVal(d, ['avgPower', 'AvgPower']);
            if (pwr > 0) { val = pwr / rpe; breakdown = `${Math.round(pwr)}W / ${rpe} RPE`; match = true; }
        }
        else if (sportMode === 'run' && checkSport(d, 'RUN')) {
            const spd = getVal(d, ['avgSpeed', 'AvgSpeed']);
            if (spd > 0) { val = spd / rpe; breakdown = `${spd.toFixed(2)} m/s / ${rpe} RPE`; match = true; }
        }
        else if (sportMode === 'swim' && checkSport(d, 'SWIM')) {
            const spd = getVal(d, ['avgSpeed', 'AvgSpeed']);
            if (spd > 0) { val = spd / rpe; breakdown = `${spd.toFixed(2)} m/s / ${rpe} RPE`; match = true; }
        }

        if (match && val > 0) return { date: d.date, dateStr: d.date.toISOString().split('T')[0], val: val, name: d.actualName, breakdown: breakdown };
        return null;
    }).filter(Boolean).sort((a, b) => a.date - b.date);
};

// --- FIX: EXPLICIT EXPORT ---
export const extractSubjectiveTableData = (data, key) => {
    let sportMode = null;
    if (key === 'subjective_bike') sportMode = 'bike';
    else if (key === 'subjective_run') sportMode = 'run';
    else if (key === 'subjective_swim') sportMode = 'swim';
    if (!sportMode) return [];
    return calculateSubjectiveEfficiency(data, sportMode);
};
