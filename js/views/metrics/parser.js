// js/views/metrics/parser.js
import { checkSport } from './utils.js';

export const METRIC_FORMULAS = {
    'subjective_bike': 'Avg Power / RPE',
    'subjective_run': 'Avg Speed / RPE',
    'subjective_swim': 'Avg Speed / RPE',
    'endurance': 'Avg Power / Avg HR',
    'strength': 'Avg Power / Avg Cadence',
    'run': 'Avg Speed / Avg HR',
    'swim': 'Avg Speed / HR',
    'mechanical': 'Avg Speed / Avg Power'
};

// --- DEBUG: Field Checker ---
const getVal = (item, keys) => {
    for (const k of keys) {
        if (item[k] !== undefined && item[k] !== null && item[k] !== "") {
            const v = parseFloat(item[k]);
            if (!isNaN(v)) return v;
        }
    }
    return 0;
};

// --- DEBUG: Configuration ---
// These are the STRICT fields we are looking for.
const FIELD_MAP = {
    pwr: ['avgPower', 'AvgPower', 'averagePower', 'Power'],
    hr:  ['avgHR', 'AvgHR', 'averageHeartRate', 'HeartRate'],
    cad: ['avgCadence', 'AvgCadence', 'averageCadence', 'Cadence', 'rpm'],
    spd: ['avgSpeed', 'AvgSpeed', 'averageSpeed', 'Speed'],
    rpe: ['RPE', 'rpe', 'PerceivedExertion'],
    gct: ['avgGroundContactTime', 'AvgGroundContactTime', 'GCT'],
    vert:['avgVerticalOscillation', 'AvgVerticalOscillation'],
    vo2: ['vO2MaxValue', 'VO2Max', 'vo2Max'],
    ana: ['anaerobicTrainingEffect', 'AnaerobicEffect'],
    tss: ['trainingStressScore', 'TSS', 'tss']
};

// --- DEBUG: Health Report ---
export const runDataHealthCheck = (data) => {
    console.group("🏥 Metrics Data Health Check");
    
    if (!data || data.length === 0) {
        console.error("❌ No data received by Parser!");
        console.groupEnd();
        return;
    }

    console.log(`Checking ${data.length} records...`);
    console.log("Sample Record Keys:", Object.keys(data[0]));

    const checkMetric = (name, sport, requiredFields) => {
        const sportItems = data.filter(d => checkSport(d, sport));
        let validCount = 0;
        
        sportItems.forEach(d => {
            const hasAll = requiredFields.every(fieldKey => {
                const val = getVal(d, FIELD_MAP[fieldKey]);
                return val > 0;
            });
            if (hasAll) validCount++;
        });

        const status = validCount > 0 ? "✅" : "❌";
        console.log(`${status} [${name}]: Found ${validCount}/${sportItems.length} valid ${sport} records.`);
        
        if (validCount === 0 && sportItems.length > 0) {
            console.warn(`   ⚠️ Missing fields for ${name}. Looking for:`, requiredFields.map(k => FIELD_MAP[k].join(' OR ')));
            console.log("   ⚠️ Sample data dump for this sport:", sportItems[0]);
        }
    };

    checkMetric('Endurance (Aerobic Eff)', 'BIKE', ['pwr', 'hr']);
    checkMetric('Strength (Torque)', 'BIKE', ['pwr', 'cad']);
    checkMetric('Run Economy', 'RUN', ['spd', 'hr']);
    checkMetric('Mechanical Stiffness', 'RUN', ['spd', 'pwr']);
    checkMetric('Swim Efficiency', 'SWIM', ['spd', 'hr']);
    
    console.groupEnd();
};

// --- EXTRACTORS ---

export const aggregateWeeklyTSS = (data) => {
    const weeks = {};
    data.forEach(d => {
        const tss = getVal(d, FIELD_MAP.tss);
        if (tss <= 0) return;
        const date = new Date(d.date);
        const diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);
        const weekEnd = new Date(date.setDate(diff + 6));
        const key = weekEnd.toISOString().split('T')[0];
        if (!weeks[key]) weeks[key] = 0;
        weeks[key] += tss;
    });
    return Object.keys(weeks).sort().map(k => ({
        date: new Date(k), dateStr: k, name: "Weekly Load", val: weeks[k], breakdown: `TSS: ${Math.round(weeks[k])}`
    }));
};

export const extractMetricData = (data, key) => {
    switch(key) {
        case 'endurance': return data.filter(x => checkSport(x, 'BIKE')).map(x => {
            const p = getVal(x, FIELD_MAP.pwr); const h = getVal(x, FIELD_MAP.hr);
            return (p>0 && h>0) ? { val: p/h, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `P:${Math.round(p)}/H:${Math.round(h)}` } : null;
        }).filter(Boolean);

        case 'strength': return data.filter(x => checkSport(x, 'BIKE')).map(x => {
            const p = getVal(x, FIELD_MAP.pwr); const c = getVal(x, FIELD_MAP.cad);
            return (p>0 && c>0) ? { val: p/c, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `P:${Math.round(p)}/C:${Math.round(c)}` } : null;
        }).filter(Boolean);

        case 'run': return data.filter(x => checkSport(x, 'RUN')).map(x => {
            const s = getVal(x, FIELD_MAP.spd); const h = getVal(x, FIELD_MAP.hr);
            return (s>0 && h>0) ? { val: (s*60)/h, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `S:${(s*60).toFixed(0)}/H:${Math.round(h)}` } : null;
        }).filter(Boolean);

        case 'mechanical': return data.filter(x => checkSport(x, 'RUN')).map(x => {
            const s = getVal(x, FIELD_MAP.spd); const p = getVal(x, FIELD_MAP.pwr);
            return (s>0 && p>0) ? { val: (s*100)/p, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `S:${s.toFixed(1)}/P:${Math.round(p)}` } : null;
        }).filter(Boolean);

        case 'gct': return data.filter(x => checkSport(x, 'RUN')).map(x => {
            const v = getVal(x, FIELD_MAP.gct);
            return (v>0) ? { val: v, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `${Math.round(v)}ms` } : null;
        }).filter(Boolean);

        case 'vert': return data.filter(x => checkSport(x, 'RUN')).map(x => {
            const v = getVal(x, FIELD_MAP.vert);
            return (v>0) ? { val: v, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `${v.toFixed(1)}cm` } : null;
        }).filter(Boolean);

        case 'swim': return data.filter(x => checkSport(x, 'SWIM')).map(x => {
            const s = getVal(x, FIELD_MAP.spd); const h = getVal(x, FIELD_MAP.hr);
            return (s>0 && h>0) ? { val: (s*60)/h, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `S:${(s*60).toFixed(1)}/H:${Math.round(h)}` } : null;
        }).filter(Boolean);

        case 'vo2max': return data.map(x => {
            const v = getVal(x, FIELD_MAP.vo2);
            return (v>0) ? { val: v, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: "VO2", breakdown: `${v}` } : null;
        }).filter(Boolean);

        case 'anaerobic': return data.map(x => {
            const v = getVal(x, FIELD_MAP.ana);
            return (v>0.5) ? { val: v, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `${v}` } : null;
        }).filter(Boolean);

        case 'tss': return aggregateWeeklyTSS(data);
        default: return [];
    }
};

export const calculateSubjectiveEfficiency = (data, sportMode) => {
    return data.map(d => {
        const rpe = getVal(d, FIELD_MAP.rpe);
        if (rpe <= 0) return null;
        
        let val=0, breakdown="";
        const s = sportMode.toUpperCase();
        
        if (s === 'BIKE' && checkSport(d, 'BIKE')) {
            const p = getVal(d, FIELD_MAP.pwr);
            if(p>0) { val=p/rpe; breakdown=`${Math.round(p)}W/${rpe}`; }
        } else if (s === 'RUN' && checkSport(d, 'RUN')) {
            const sp = getVal(d, FIELD_MAP.spd);
            if(sp>0) { val=sp/rpe; breakdown=`${sp.toFixed(1)}/${rpe}`; }
        } else if (s === 'SWIM' && checkSport(d, 'SWIM')) {
            const sp = getVal(d, FIELD_MAP.spd);
            if(sp>0) { val=sp/rpe; breakdown=`${sp.toFixed(1)}/${rpe}`; }
        }
        
        return (val>0) ? { val, date: d.date, dateStr: d.date.toISOString().split('T')[0], name: d.actualName, breakdown } : null;
    }).filter(Boolean).sort((a,b)=>a.date-b.date);
};

// --- FIX: EXPLICIT EXPORT ---
export const extractSubjectiveTableData = (data, key) => {
    if (!key.startsWith('subjective_')) return [];
    const sport = key.split('_')[1];
    return calculateSubjectiveEfficiency(data, sport);
};
