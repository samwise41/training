// js/views/metrics/charts.js
import { Formatters } from '../../utils/formatting.js'; 
import { extractMetricData } from './parser.js';

let charts = {};

export const updateCharts = (data, timeRange) => {
    const C = Formatters.COLORS; 

    const CHART_CONFIGS = {
        // --- General (All Emerald) ---
        'vo2max':    { label: 'VO2 Max Est',      color: C.All, type: 'line', fill: true },
        'tss':       { label: 'Weekly TSS',       color: C.All, type: 'bar' },
        'anaerobic': { label: 'Anaerobic Effect', color: C.All, type: 'bar' },

        // --- Bike (All Purple) ---
        'subjective_bike': { label: 'Efficiency (Pwr/RPE)',       color: C.Bike, type: 'line' },
        'endurance':       { label: 'Aerobic Decoupling (Pwr/HR)', color: C.Bike, type: 'line' },
        'strength':        { label: 'Force (Pwr/Cad)',            color: C.Bike, type: 'line' },

        // --- Run (All Pink) ---
        'subjective_run': { label: 'Efficiency (Spd/RPE)',      color: C.Run, type: 'line' },
        'run':            { label: 'Running Economy (Pace/HR)', color: C.Run, type: 'line' },
        'mechanical':     { label: 'Form (Spd/Pwr)',            color: C.Run, type: 'line' },
        'gct':            { label: 'Ground Contact (ms)',       color: C.Run, type: 'line', reverse: true },
        'vert':           { label: 'Vert Oscillation (cm)',     color: C.Run, type: 'line', reverse: true },

        // --- Swim (All Cyan) ---
        'subjective_swim': { label: 'Efficiency (Spd/RPE)',   color: C.Swim, type: 'line' },
        'swim':            { label: 'Swim Efficiency (Spd/HR)', color: C.Swim, type: 'line' }
    };

    // ... (Rest of the file logic remains exactly the same) ...
    Object.keys(charts).forEach(k => { if (charts[k]) charts[k].destroy(); });
    charts = {};

    const now = new Date();
    const cutoff = new Date();
    if (timeRange === '30d') cutoff.setDate(now.getDate() - 30);
    else if (timeRange === '90d') cutoff.setDate(now.getDate() - 90);
    else if (timeRange === '6m') cutoff.setMonth(now.getMonth() - 6);
    else if (timeRange === '1y') cutoff.setFullYear(now.getFullYear() - 1);

    const filteredData = data.filter(d => d.date >= cutoff);

    Object.entries(CHART_CONFIGS).forEach(([key, config]) => {
        const canvas = document.getElementById(`metric-chart-${key}`);
        if (!canvas) return;
        const points = extractMetricData(filteredData, key);

        if (!points || points.length === 0) {
            canvas.parentElement.innerHTML = `<div class="h-32 flex items-center justify-center text-xs text-slate-600 italic">No data for ${config.label}</div>`;
            return;
        }

        if (canvas.tagName !== 'CANVAS') {
            const newCanvas = document.createElement('canvas');
            newCanvas.id = `metric-chart-${key}`;
            canvas.replaceWith(newCanvas);
        }

        const ctx = document.getElementById(`metric-chart-${key}`).getContext('2d');
        
        charts[key] = new Chart(ctx, {
            type: config.type,
            data: {
                labels: points.map(p => p.dateStr),
                datasets: [{
                    label: config.label,
                    data: points.map(p => p.val),
                    borderColor: config.color,
                    backgroundColor: config.type === 'line' ? config.color + '10' : config.color + '80',
                    borderWidth: 2,
                    pointRadius: 2,
                    pointHoverRadius: 4,
                    fill: config.fill || false,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onClick: (e, activeEls) => {
                    if (activeEls.length > 0 && window.handleMetricChartClick) {
                        const idx = activeEls[0].index;
                        const pt = points[idx];
                        window.handleMetricChartClick(e.native, pt.dateStr, pt.name, pt.val, '', pt.breakdown, config.color);
                    }
                },
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: {
                    x: { display: false },
                    y: {
                        display: true,
                        reverse: config.reverse || false,
                        grid: { color: '#334155' },
                        ticks: { color: '#64748b', font: { size: 9 } }
                    }
                }
            }
        });

        const parent = document.getElementById(`metric-chart-${key}`).parentElement;
        if (!parent.classList.contains('chart-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'chart-wrapper h-[150px] bg-slate-800/50 rounded-lg p-2 border border-slate-700/50';
            document.getElementById(`metric-chart-${key}`).replaceWith(wrapper);
            wrapper.appendChild(document.getElementById(`metric-chart-${key}`));
        }
    });
};
