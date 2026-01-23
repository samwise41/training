// js/views/metrics/charts.js
import { Formatters } from '../../utils/formatting.js'; 
import { extractMetricData } from './parser.js';

let charts = {};

// Helper: safe color retrieval
const C = Formatters.COLORS;

const CHART_CONFIGS = {
    // --- General Fitness ---
    'vo2max': { label: 'VO2 Max Est', color: C.Run, type: 'line', fill: true },
    'tss': { label: 'Weekly TSS', color: '#f59e0b', type: 'bar' }, // Amber
    'anaerobic': { label: 'Anaerobic Effect', color: '#ef4444', type: 'bar' }, // Red

    // --- Cycling ---
    'subjective_bike': { label: 'Efficiency (Pwr/RPE)', color: C.Bike, type: 'line' },
    'endurance': { label: 'Aerobic Decoupling (Pwr/HR)', color: '#a855f7', type: 'line' }, // Purple
    'strength': { label: 'Force (Pwr/Cad)', color: '#6366f1', type: 'line' }, // Indigo

    // --- Running ---
    'subjective_run': { label: 'Efficiency (Spd/RPE)', color: C.Run, type: 'line' },
    'run': { label: 'Running Economy (Pace/HR)', color: '#ec4899', type: 'line' }, // Pink
    'mechanical': { label: 'Form (Spd/Pwr)', color: '#14b8a6', type: 'line' }, // Teal
    'gct': { label: 'Ground Contact (ms)', color: '#f43f5e', type: 'line', reverse: true }, // Rose
    'vert': { label: 'Vert Oscillation (cm)', color: '#8b5cf6', type: 'line', reverse: true }, // Violet

    // --- Swimming ---
    'subjective_swim': { label: 'Efficiency (Spd/RPE)', color: C.Swim, type: 'line' },
    'swim': { label: 'Swim Efficiency (Spd/HR)', color: '#0ea5e9', type: 'line' } // Sky Blue
};

export const updateCharts = (data, timeRange) => {
    // Destroy old charts to prevent memory leaks or ghosting
    Object.keys(charts).forEach(k => {
        if (charts[k]) charts[k].destroy();
    });
    charts = {};

    // Filter Data by Time Range
    const now = new Date();
    const cutoff = new Date();
    if (timeRange === '30d') cutoff.setDate(now.getDate() - 30);
    else if (timeRange === '90d') cutoff.setDate(now.getDate() - 90);
    else if (timeRange === '6m') cutoff.setMonth(now.getMonth() - 6);
    else if (timeRange === '1y') cutoff.setFullYear(now.getFullYear() - 1);

    const filteredData = data.filter(d => d.date >= cutoff);

    // Create Charts
    Object.entries(CHART_CONFIGS).forEach(([key, config]) => {
        const canvas = document.getElementById(`metric-chart-${key}`);
        if (!canvas) return;

        // Extract data specific to this metric
        const points = extractMetricData(filteredData, key);
        if (!points || points.length === 0) {
            canvas.parentElement.innerHTML = `<div class="h-32 flex items-center justify-center text-xs text-slate-600 italic">No data for ${config.label}</div>`;
            return;
        }

        // Create Canvas Element if it was replaced by error message previously
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
                    backgroundColor: config.type === 'line' ? config.color + '10' : config.color + '80', // 10 = low opacity, 80 = high
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
                    if (activeEls.length > 0) {
                        const idx = activeEls[0].index;
                        const pt = points[idx];
                        // Call Global Handler
                        if(window.handleMetricChartClick) {
                            window.handleMetricChartClick(e.native, pt.dateStr, pt.name, pt.val, '', pt.breakdown, config.color);
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false } // We use custom click tooltips
                },
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

        // Wrap canvas in container for height control
        const parent = document.getElementById(`metric-chart-${key}`).parentElement;
        if (!parent.classList.contains('chart-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'chart-wrapper h-[150px] bg-slate-800/50 rounded-lg p-2 border border-slate-700/50';
            document.getElementById(`metric-chart-${key}`).replaceWith(wrapper);
            wrapper.appendChild(document.getElementById(`metric-chart-${key}`));
        }
    });
};
