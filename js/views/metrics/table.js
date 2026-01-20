// js/views/metrics/table.js
import { METRIC_DEFINITIONS } from './definitions.js';
import { checkSport, calculateTrend, getTrendIcon } from './utils.js';

const METRIC_FORMULAS = {
    'subjective_bike': '(Avg Power / RPE)',
    'subjective_run': '(Avg Speed / RPE)',
    'subjective_swim': '(Avg Speed / RPE)',
    'endurance': '(Norm Power / Avg HR)',
    'strength': '(Torque / Output)',
    'run': '(Avg Power / Avg Speed)',
    'swim': '(Avg Speed / Stroke Rate)',
    'mechanical': '(Vert Osc / GCT)'
};

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
            return []; // Handled by aggregate logic elsewhere or returned empty if not needed
        default: return [];
    }
};

const extractSubjectiveTableData = (data, key) => {
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

export const renderSummaryTable = (allData) => {
    let rows = '';
    const now = new Date();

    const groups = [
        { name: 'General Fitness', keys: ['vo2max', 'anaerobic'] },
        { name: 'Cycling Metrics', keys: ['subjective_bike', 'endurance', 'strength'] },
        { name: 'Running Metrics', keys: ['subjective_run', 'run', 'mechanical', 'gct', 'vert'] },
        { name: 'Swimming Metrics', keys: ['subjective_swim', 'swim'] }
    ];

    groups.forEach(group => {
        rows += `
            <tr class="bg-slate-900/80">
                <td colspan="5" class="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700">
                    ${group.name}
                </td>
            </tr>
        `;

        group.keys.forEach(key => {
            const def = METRIC_DEFINITIONS[key];
            if (!def) return;

            let fullData;
            if (key.startsWith('subjective_')) {
                fullData = extractSubjectiveTableData(allData, key);
            } else {
                fullData = extractMetricData(allData, key).sort((a,b) => a.date - b.date);
            }
            
            if (!fullData || !fullData.length) return;

            const getT = (days) => {
                const cutoff = new Date();
                cutoff.setDate(now.getDate() - days);
                const subset = fullData.filter(d => d.date >= cutoff);
                const trend = calculateTrend(subset);
                return trend ? getTrendIcon(trend.slope, def.invertRanges) : { icon: 'fa-minus', color: 'text-slate-600' };
            };

            const t30 = getT(30);
            const t90 = getT(90);
            const t6m = getT(180);

            const recentSubset = fullData.filter(d => d.date >= new Date(now.getTime() - 30*24*60*60*1000));
            let statusHtml = '<span class="text-slate-500">--</span>';
            if (recentSubset.length > 0) {
                const avg30 = recentSubset.reduce((sum, d) => sum + d.val, 0) / recentSubset.length;
                if (def.invertRanges) {
                    if (avg30 <= def.refMax) statusHtml = '<span class="text-emerald-400 font-bold text-[10px] bg-emerald-900/30 px-1.5 py-0.5 rounded">✅ On Target</span>';
                    else statusHtml = '<span class="text-red-400 font-bold text-[10px] bg-red-900/30 px-1.5 py-0.5 rounded">⚠️ High</span>';
                } else {
                    if (avg30 >= def.refMin) statusHtml = '<span class="text-emerald-400 font-bold text-[10px] bg-emerald-900/30 px-1.5 py-0.5 rounded">✅ On Target</span>';
                    else statusHtml = '<span class="text-red-400 font-bold text-[10px] bg-red-900/30 px-1.5 py-0.5 rounded">⚠️ Low</span>';
                }
            }

            const iconCell = `
                <div onclick="window.scrollToMetric('${key}')" class="w-6 h-6 rounded flex items-center justify-center bg-slate-800 border border-slate-700 cursor-pointer hover:bg-slate-700 hover:border-slate-500 hover:scale-110 transition-all duration-200 group shadow-sm" title="Jump to Chart">
                    <i class="fa-solid ${def.icon} text-xs group-hover:text-white transition-colors" style="color: ${def.colorVar}"></i>
                </div>`;

            const formula = METRIC_FORMULAS[key] || '';
            const titleHtml = `
                <div class="font-bold text-slate-200">
                    ${def.title}
                    ${formula ? `<span class="text-[10px] font-normal opacity-50 ml-1 font-mono">${formula}</span>` : ''}
                </div>
            `;

            rows += `
                <tr class="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                    <td class="px-4 py-3 flex items-center gap-3">
                        ${iconCell}
                        <div>
                            ${titleHtml}
                            <div class="text-[9px] text-slate-500 font-mono">${def.rangeInfo}</div>
                        </div>
                    </td>
                    <td class="px-4 py-3 text-center"><i class="fa-solid ${t30.icon} ${t30.color}"></i></td>
                    <td class="px-4 py-3 text-center"><i class="fa-solid ${t90.icon} ${t90.color}"></i></td>
                    <td class="px-4 py-3 text-center"><i class="fa-solid ${t6m.icon} ${t6m.color}"></i></td>
                    <td class="px-4 py-3 text-right">${statusHtml}</td>
                </tr>`;
        });
    });

    return `
        <div class="overflow-x-auto bg-slate-800/30 border border-slate-700 rounded-xl mb-4 shadow-sm">
            <table class="w-full text-left text-xs">
                <thead class="bg-slate-900/50 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                        <th class="px-4 py-3">Metric & Target</th>
                        <th class="px-4 py-3 text-center">30d</th>
                        <th class="px-4 py-3 text-center">90d</th>
                        <th class="px-4 py-3 text-center">6m</th>
                        <th class="px-4 py-3 text-right">Current Status</th>
                    </tr>
