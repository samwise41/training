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

// --- Helper: Weekly TSS Aggregation ---
export const aggregateWeeklyTSS = (data) => {
    const weeks = {};
    data.forEach(d => {
        const tss = parseFloat(d.trainingStressScore || d.tss || 0);
        if (tss === 0) return;
        
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

// --- Main Data Extractor ---
export const extractMetricData = (data, key) => {
    // Helper to check training effect labels if they exist
    const isInt = (item, labels) => {
        const l = (item.trainingEffectLabel || "").toString().toUpperCase().trim();
        return labels.some(allowed => l === allowed.toUpperCase());
    };

    switch(key) {
        // CYCLING
        case 'endurance': 
            return data.filter(x => checkSport(x, 'BIKE') && x.avgPower > 0 && x.avgHR > 0).map(x => ({ 
                val: x.avgPower / x.avgHR, 
                date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName || x.activityName, 
                breakdown: `Pwr:${Math.round(x.avgPower)} / HR:${Math.round(x.avgHR)}` 
            }));
        case 'strength': 
            return data.filter(x => checkSport(x, 'BIKE') && x.avgPower > 0 && x.avgCadence > 0).map(x => ({ 
                val: x.avgPower / x.avgCadence, 
                date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName || x.activityName, 
                breakdown: `Pwr:${Math.round(x.avgPower)} / RPM:${Math.round(x.avgCadence)}` 
            }));
        
        // RUNNING
        case 'run': 
            return data.filter(x => checkSport(x, 'RUN') && x.avgSpeed > 0 && x.avgHR > 0).map(x => ({ 
                val: (x.avgSpeed * 60) / x.avgHR, 
                date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName || x.activityName, 
                breakdown: `Pace:${Math.round(x.avgSpeed*60)}m/m / HR:${Math.round(x.avgHR)}` 
            }));
        case 'mechanical': 
            return data.filter(x => checkSport(x, 'RUN') && x.avgSpeed > 0 && x.avgPower > 0).map(x => ({ 
                val: (x.avgSpeed * 100) / x.avgPower, 
                date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName || x.activityName, 
                breakdown: `Spd:${x.avgSpeed.toFixed(1)} / Pwr:${Math.round(x.avgPower)}` 
            }));
        case 'gct': 
            return data.filter(x => checkSport(x, 'RUN') && x.avgGroundContactTime > 0).map(x => ({ 
                val: x.avgGroundContactTime, 
                date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName || x.activityName, 
                breakdown: `${Math.round(x.avgGroundContactTime)} ms` 
            }));
        case 'vert': 
            return data.filter(x => checkSport(x, 'RUN') && x.avgVerticalOscillation > 0).map(x => ({ 
                val: x.avgVerticalOscillation, 
                date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName || x.activityName, 
                breakdown: `${x.avgVerticalOscillation.toFixed(1)} cm` 
            }));
        
        // SWIMMING
        case 'swim': 
            return data.filter(x => checkSport(x, 'SWIM') && x.avgSpeed > 0 && x.avgHR > 0).map(x => ({ 
                val: (x.avgSpeed * 60) / x.avgHR, 
                date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName || x.activityName, 
                breakdown: `Spd:${(x.avgSpeed*60).toFixed(1)}m/m / HR:${Math.round(x.avgHR)}` 
            }));
        
        // GENERAL
        case 'vo2max': 
            return data.filter(x => x.vO2MaxValue > 0).map(x => ({ 
                val: x.vO2MaxValue, 
                date: x.date, dateStr: x.date.toISOString().split('T')[0], name: "VO2 Est", 
                breakdown: `Score: ${x.vO2MaxValue}` 
            }));
        case 'anaerobic': 
            return data.filter(x => x.anaerobicTrainingEffect > 0.5).map(x => ({ 
                val: x.anaerobicTrainingEffect, 
                date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName || x.activityName, 
                breakdown: `Anaerobic: ${x.anaerobicTrainingEffect}` 
            }));
        case 'tss': 
            return aggregateWeeklyTSS(data);
        default: return [];
    }
};

export const extractSubjectiveTableData = (data, key) => {
    let sportMode = null;
    if (key === 'subjective_bike') sportMode = 'bike';
    else if (key === 'subjective_run') sportMode = 'run';
    else if (key === 'subjective_swim') sportMode = 'swim';
    if (!sportMode) return [];

    return data.map(d => {
        const rpe = parseFloat(d.RPE || d.rpe || 0);
        if (rpe <= 0) return null;
        let val = 0;

        if (sportMode === 'bike' && checkSport(d, 'BIKE')) {
            const pwr = parseFloat(d.avgPower);
            if (pwr > 0) val = pwr / rpe;
        } else if (sportMode === 'run' && checkSport(d, 'RUN')) {
            const spd = parseFloat(d.avgSpeed);
            if (spd > 0) val = spd / rpe;
        } else if (sportMode === 'swim' && checkSport(d, 'SWIM')) {
            const spd = parseFloat(d.avgSpeed);
            if (spd > 0) val = spd / rpe;
        }
        
        if (val > 0) return { val, date: d.date };
        return null;
    }).filter(Boolean).sort((a,b) => a.date - b.date);
};

export const calculateSubjectiveEfficiency = (allData, sportMode) => {
    return allData
        .map(d => {
            const rpe = parseFloat(d.RPE || d.rpe || 0);
            if (!rpe || rpe <= 0) return null;

            let val = 0;
            let breakdown = "";
            let match = false;

            if (sportMode === 'bike' && checkSport(d, 'BIKE')) {
                const pwr = parseFloat(d.avgPower);
                if (pwr > 0) { val = pwr / rpe; breakdown = `${Math.round(pwr)}W / ${rpe} RPE`; match = true; }
            }
            else if (sportMode === 'run' && checkSport(d, 'RUN')) {
                const spd = parseFloat(d.avgSpeed); 
                if (spd > 0) { val = spd / rpe; breakdown = `${spd.toFixed(2)} m/s / ${rpe} RPE`; match = true; }
            }
            else if (sportMode === 'swim' && checkSport(d, 'SWIM')) {
                const spd = parseFloat(d.avgSpeed);
                if (spd > 0) { val = spd / rpe; breakdown = `${spd.toFixed(2)} m/s / ${rpe} RPE`; match = true; }
            }

            if (match && val > 0) {
                return {
                    date: d.date,
                    dateStr: d.date.toISOString().split('T')[0],
                    val: val,
                    name: d.actualName || d.activityName || 'Activity',
                    breakdown: breakdown
                };
            }
            return null;
        })
        .filter(Boolean)
        .sort((a, b) => a.date - b.date);
};
