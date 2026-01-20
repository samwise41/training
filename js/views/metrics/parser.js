// js/views/metrics/parser.js
import { checkSport } from './utils.js';

// --- 1. DATA NORMALIZATION (The Fix) ---
// We transform the messy raw data into a strict schema ONCE.
// This prevents "guessing" keys later in the app.
export const normalizeMetricsData = (rawData) => {
    if (!rawData || !Array.isArray(rawData)) {
        console.error("❌ Metrics Parser: Received invalid data", rawData);
        return [];
    }

    // DEBUGGING: Print the keys of the first item so we see exactly what we are working with
    if (rawData.length > 0) {
        console.group("🔍 Data Debugger");
        console.log("Raw Item [0]:", rawData[0]);
        console.log("Available Keys:", Object.keys(rawData[0]));
        console.groupEnd();
    }

    return rawData.map(d => {
        // We explicitly map the likely variations to our STRICT standard keys.
        // If your JSON has different keys, you can see them in the console and add them here.
        return {
            date: new Date(d.date || d.Date),
            actualName: d.actualName || d.title || d.Name || "Activity",
            
            // Sport Types
            activityType: d.activityType,
            sportTypeId: d.sportTypeId,
            actualSport: d.actualSport || d.Sport,

            // STRICT METRICS MAPPING
            avgPower: parseFloat(d.avgPower || d.AvgPower || d.averagePower || 0),
            normPower: parseFloat(d.normPower || d.NormPower || d.normalizedPower || 0),
            
            avgHR: parseFloat(d.avgHR || d.AvgHR || d.averageHeartRate || d.HeartRate || 0),
            
            avgSpeed: parseFloat(d.avgSpeed || d.AvgSpeed || d.averageSpeed || 0),
            
            avgCadence: parseFloat(d.avgCadence || d.AvgCadence || d.averageCadence || 0),
            
            rpe: parseFloat(d.RPE || d.rpe || d.PerceivedExertion || 0),
            
            avgGroundContactTime: parseFloat(d.avgGroundContactTime || d.AvgGroundContactTime || d.groundContactTime || 0),
            avgVerticalOscillation: parseFloat(d.avgVerticalOscillation || d.AvgVerticalOscillation || d.verticalOscillation || 0),
            
            vO2MaxValue: parseFloat(d.vO2MaxValue || d.VO2Max || d.vo2Max || 0),
            anaerobicTrainingEffect: parseFloat(d.anaerobicTrainingEffect || d.AnaerobicEffect || 0),
            trainingStressScore: parseFloat(d.trainingStressScore || d.tss || d.TSS || 0)
        };
    });
};

// --- 2. CALCULATIONS (Using Strict Keys) ---

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

export const aggregateWeeklyTSS = (data) => {
    const weeks = {};
    data.forEach(d => {
        const tss = d.trainingStressScore; // Strict access
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
    // Data is already normalized, so we use exact keys.
    switch(key) {
        // CYCLING
        case 'endurance': 
            return data.filter(x => checkSport(x, 'BIKE') && x.avgPower > 0 && x.avgHR > 0).map(x => ({ 
                val: x.avgPower / x.avgHR, 
                date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, 
                breakdown: `Pwr:${Math.round(x.avgPower)} / HR:${Math.round(x.avgHR)}` 
            }));
        case 'strength': 
            return data.filter(x => checkSport(x, 'BIKE') && x.avgPower > 0 && x.avgCadence > 0).map(x => ({ 
                val: x.avgPower / x.avgCadence, 
                date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, 
                breakdown: `Pwr:${Math.round(x.avgPower)} / RPM:${Math.round(x.avgCadence)}` 
            }));
        
        // RUNNING
        case 'run': 
            return data.filter(x => checkSport(x, 'RUN') && x.avgSpeed > 0 && x.avgHR > 0).map(x => ({ 
                val: (x.avgSpeed * 60) / x.avgHR, 
                date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, 
                breakdown: `Pace:${Math.round(x.avgSpeed*60)}m/m / HR:${Math.round(x.avgHR)}` 
            }));
        case 'mechanical': 
            return data.filter(x => checkSport(x, 'RUN') && x.avgSpeed > 0 && x.avgPower > 0).map(x => ({ 
                val: (x.avgSpeed * 100) / x.avgPower, 
                date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, 
                breakdown: `Spd:${x.avgSpeed.toFixed(1)} / Pwr:${Math.round(x.avgPower)}` 
            }));
        case 'gct': 
            return data.filter(x => checkSport(x, 'RUN') && x.avgGroundContactTime > 0).map(x => ({ 
                val: x.avgGroundContactTime, 
                date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, 
                breakdown: `${Math.round(x.avgGroundContactTime)} ms` 
            }));
        case 'vert': 
            return data.filter(x => checkSport(x, 'RUN') && x.avgVerticalOscillation > 0).map(x => ({ 
                val: x.avgVerticalOscillation, 
                date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, 
                breakdown: `${x.avgVerticalOscillation.toFixed(1)} cm` 
            }));
        
        // SWIMMING
        case 'swim': 
            return data.filter(x => checkSport(x, 'SWIM') && x.avgSpeed > 0 && x.avgHR > 0).map(x => ({ 
                val: (x.avgSpeed * 60) / x.avgHR, 
                date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, 
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
                date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, 
                breakdown: `Anaerobic: ${x.anaerobicTrainingEffect}` 
            }));
        case 'tss': 
            return aggregateWeeklyTSS(data);
        default: return [];
    }
};

export const calculateSubjectiveEfficiency = (allData, sportMode) => {
    return allData
        .map(d => {
            // Strict RPE access
            const rpe = d.rpe;
            if (rpe <= 0) return null;

            let val = 0;
            let breakdown = "";
            let match = false;

            if (sportMode === 'bike' && checkSport(d, 'BIKE')) {
                const pwr = d.avgPower;
                if (pwr > 0) { val = pwr / rpe; breakdown = `${Math.round(pwr)}W / ${rpe} RPE`; match = true; }
            }
            else if (sportMode === 'run' && checkSport(d, 'RUN')) {
                const spd = d.avgSpeed; 
                if (spd > 0) { val = spd / rpe; breakdown = `${spd.toFixed(2)} m/s / ${rpe} RPE`; match = true; }
            }
            else if (sportMode === 'swim' && checkSport(d, 'SWIM')) {
                const spd = d.avgSpeed;
                if (spd > 0) { val = spd / rpe; breakdown = `${spd.toFixed(2)} m/s / ${rpe} RPE`; match = true; }
            }

            if (match && val > 0) {
                return {
                    date: d.date,
                    dateStr: d.date.toISOString().split('T')[0],
                    val: val,
                    name: d.actualName,
                    breakdown: breakdown
                };
            }
            return null;
        })
        .filter(Boolean)
        .sort((a, b) => a.date - b.date);
};
