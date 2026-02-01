// js/views/metrics/parser.js
import { checkSport } from './utils.js';
import { Formatters } from '../../utils/formatting.js'; 

export const METRIC_FORMULAS = {
    'subjective_bike': '(Avg Power / RPE)',
    'subjective_run': '(Avg Speed / RPE)',
    'subjective_swim': '(Avg Speed / RPE)',
    'endurance': '(Norm Power / Avg HR)',
    'strength': '(Avg Power / Avg Cadence)',
    'run': '(Avg Power / Avg Speed)',
    'swim': '(Avg Speed / Stroke Rate)',
    'mechanical': '(Vert Osc / GCT)',
    'calories': '(Weekly Sum)',
    'training_balance': '(Weekly Zone Distribution)',
    'feeling_load': '(TSS vs Feeling)'
};

const KEYS = {
    hr: 'averageHR',
    spd: 'averageSpeed',
    pwr: 'avgPower',
    cad_bike: 'averageBikingCadenceInRevPerMinute',
    cad_run: 'averageRunningCadenceInStepsPerMinute',
    rpe: 'RPE',
    gct: 'avgGroundContactTime',
    vert: 'avgVerticalOscillation',
    vo2: 'vO2MaxValue',
    ana: 'anaerobicTrainingEffect',
    tss: 'trainingStressScore',
    cals: 'calories',
    effect: 'trainingEffectLabel',
    feeling: 'Feeling'
};

const getVal = (item, key) => {
    if (key === 'duration' || key === 'time' || key === 'moving_time') {
        return Formatters.parseDuration(item[key]);
    }
    const v = parseFloat(item[key]);
    return (!isNaN(v) && v !== 0) ? v : 0;
};

export const normalizeMetricsData = (rawData) => {
    if (!rawData || !Array.isArray(rawData)) return [];

    // --- FILTER: Exclude Junk Miles ---
    // This ensures activities marked "exclude": true in JSON are ignored
    const validData = rawData.filter(d => d.exclude !== true);

    return validData.map(d => ({
        ...d,
        date: new Date(d.date),
        actualName: d.actualWorkout || d.activityType || "Activity",
        _pwr: getVal(d, KEYS.pwr),
        _hr:  getVal(d, KEYS.hr),
        _spd: getVal(d, KEYS.spd),
        _rpe: getVal(d, KEYS.rpe),
        _gct: getVal(d, KEYS.gct),
        _vert: getVal(d, KEYS.vert),
        _vo2: getVal(d, KEYS.vo2),
        _ana: getVal(d, KEYS.ana),
        _tss: getVal(d, KEYS.tss),
        _cals: getVal(d, KEYS.cals),
        _cad: getVal(d, KEYS.cad_bike) || getVal(d, KEYS.cad_run),
        _effect: d[KEYS.effect] || 'UNKNOWN',
        _feeling: getVal(d, KEYS.feeling)
    }));
};

// --- Aggregators ---

const getWeekKey = (dateObj) => {
    const d = new Date(dateObj);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? 0 : 7); // Adjust to Sunday
    const weekEnd = new Date(d.setDate(diff));
    weekEnd.setHours(0,0,0,0);
    return weekEnd.toISOString().split('T')[0];
};

export const aggregateWeeklyTSS = (data) => {
    const weeks = {};
    data.forEach(d => {
        const val = d._tss;
        if (val <= 0) return;
        const key = getWeekKey(d.date);
        if (!weeks[key]) weeks[key] = 0;
        weeks[key] += val;
    });
    return Object.keys(weeks).sort().map(k => ({
        date: new Date(k), dateStr: `Week Ending ${k}`, name: "Weekly Load", val: weeks[k], breakdown: `Total TSS: ${Math.round(weeks[k])}`
    }));
};

export const aggregateWeeklyCalories = (data) => {
    const weeks = {};
    data.forEach(d => {
        const val = d._cals;
        if (val <= 0) return;
        const key = getWeekKey(d.date);
        if (!weeks[key]) weeks[key] = 0;
        weeks[key] += val;
    });
    return Object.keys(weeks).sort().map(k => ({
        date: new Date(k), dateStr: `Week Ending ${k}`, name: "Weekly Energy", val: weeks[k], breakdown: `Total: ${Math.round(weeks[k])} kcal`
    }));
};

// --- Stacked Bar (Training Balance) ---
export const aggregateWeeklyBalance = (data) => {
    const weeks = {};
    
    data.forEach(d => {
        const key = getWeekKey(d.date);
        if (!weeks[key]) weeks[key] = { RECOVERY: 0, AEROBIC_BASE: 0, TEMPO: 0, LACTATE_THRESHOLD: 0, VO2MAX: 0, ANAEROBIC_CAPACITY: 0, total: 0 };
        
        const label = d._effect || 'UNKNOWN';
        if (weeks[key].hasOwnProperty(label)) {
            weeks[key][label]++;
            weeks[key].total++;
        }
    });

    return Object.keys(weeks).sort().map(k => {
        const w = weeks[k];
        const dist = {
            Recovery: w.total ? (w.RECOVERY / w.total) * 100 : 0,
            Aerobic: w.total ? (w.AEROBIC_BASE / w.total) * 100 : 0,
            Tempo: w.total ? (w.TEMPO / w.total) * 100 : 0,
            Threshold: w.total ? (w.LACTATE_THRESHOLD / w.total) * 100 : 0,
            VO2: w.total ? ((w.VO2MAX + w.ANAEROBIC_CAPACITY) / w.total) * 100 : 0
        };
        return {
            date: new Date(k),
            dateStr: k,
            distribution: dist,
            totalActivities: w.total,
            name: "Training Distribution"
        };
    });
};

// --- Feeling vs Load (Dual Axis) ---
export const aggregateFeelingVsLoad = (data) => {
    const weeks = {};
    data.forEach(d => {
        const key = getWeekKey(d.date);
        if (!weeks[key]) weeks[key] = { tss: 0, feelingSum: 0, feelingCount: 0 };
        
        const load = d._tss > 0 ? d._tss : (d.duration ? d.duration / 60 : 0); 
        weeks[key].tss += load;

        if (d._feeling > 0) {
            weeks[key].feelingSum += d._feeling;
            weeks[key].feelingCount++;
        }
    });

    return Object.keys(weeks).sort().map(k => {
        const w = weeks[k];
        const avgFeeling = w.feelingCount > 0 ? (w.feelingSum / w.feelingCount) : null;
        return {
            date: new Date(k),
            dateStr: `Week of ${k}`,
            load: Math.round(w.tss),
            feeling: avgFeeling,
            name: "Load vs Feeling"
        };
    });
};

export const extractMetricData = (data, key) => {
    switch(key) {
        case 'endurance': 
            return data.filter(x => checkSport(x, 'BIKE')).map(x => {
                if (x._pwr > 0 && x._hr > 0) return { val: x._pwr / x._hr, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `Pwr:${Math.round(x._pwr)} / HR:${Math.round(x._hr)}` };
            }).filter(Boolean);
        case 'strength': 
            return data.filter(x => checkSport(x, 'BIKE')).map(x => {
                if (x._pwr > 0 && x._cad > 0) return { val: x._pwr / x._cad, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `Pwr:${Math.round(x._pwr)} / RPM:${Math.round(x._cad)}` };
            }).filter(Boolean);
        case 'run': 
            return data.filter(x => checkSport(x, 'RUN')).map(x => {
                if (x._spd > 0 && x._hr > 0) return { val: (x._spd * 60) / x._hr, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `Pace:${Math.round(x._spd*60)}m/m / HR:${Math.round(x._hr)}` };
            }).filter(Boolean);
        case 'mechanical': 
            return data.filter(x => checkSport(x, 'RUN')).map(x => {
                if (x._spd > 0 && x._pwr > 0) return { val: (x._spd * 100) / x._pwr, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `Spd:${x._spd.toFixed(1)} / Pwr:${Math.round(x._pwr)}` };
            }).filter(Boolean);
        case 'gct': 
            return data.filter(x => checkSport(x, 'RUN') && x._gct > 0).map(x => ({ val: x._gct, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `${Math.round(x._gct)} ms` }));
        case 'vert': 
            return data.filter(x => checkSport(x, 'RUN') && x._vert > 0).map(x => ({ val: x._vert, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `${x._vert.toFixed(1)} cm` }));
        case 'swim': 
            return data.filter(x => checkSport(x, 'SWIM')).map(x => {
                if (x._spd > 0 && x._hr > 0) return { val: (x._spd * 60) / x._hr, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `Spd:${(x._spd*60).toFixed(1)}m/m / HR:${Math.round(x._hr)}` };
            }).filter(Boolean);
        case 'vo2max': 
            return data.map(x => { if (x._vo2 > 0) return { val: x._vo2, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: "VO2 Est", breakdown: `Score: ${x._vo2}` }; }).filter(Boolean);
        case 'anaerobic': 
            return data.map(x => { if (x._ana > 0.5) return { val: x._ana, date: x.date, dateStr: x.date.toISOString().split('T')[0], name: x.actualName, breakdown: `Anaerobic: ${x._ana}` }; }).filter(Boolean);
        case 'tss': return aggregateWeeklyTSS(data);
        case 'calories': return aggregateWeeklyCalories(data);
        
        case 'training_balance': return aggregateWeeklyBalance(data);
        case 'feeling_load': return aggregateFeelingVsLoad(data);
        
        default: return [];
    }
};

export const calculateSubjectiveEfficiency = (allData, sportMode) => {
    return allData.map(d => {
        const rpe = d._rpe;
        if (!rpe || rpe <= 0) return null;
        let val = 0, breakdown = "", match = false;
        if (sportMode === 'bike' && checkSport(d, 'BIKE') && d._pwr > 0) { val = d._pwr / rpe; breakdown = `${Math.round(d._pwr)}W / ${rpe} RPE`; match = true; }
        else if (sportMode === 'run' && checkSport(d, 'RUN') && d._spd > 0) { val = d._spd / rpe; breakdown = `${d._spd.toFixed(2)} m/s / ${rpe} RPE`; match = true; }
        else if (sportMode === 'swim' && checkSport(d, 'SWIM') && d._spd > 0) { val = d._spd / rpe; breakdown = `${d._spd.toFixed(2)} m/s / ${rpe} RPE`; match = true; }
        if (match && val > 0) return { date: d.date, dateStr: d.date.toISOString().split('T')[0], val: val, name: d.actualName, breakdown: breakdown };
        return null;
    }).filter(Boolean).sort((a, b) => a.date - b.date);
};

export const extractSubjectiveTableData = (data, key) => {
    if (key.startsWith('subjective_')) return calculateSubjectiveEfficiency(data, key.split('_')[1]);
    return [];
};
