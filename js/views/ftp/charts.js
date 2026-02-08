// js/views/ftp/charts.js
import { TooltipManager } from '../../utils/tooltipManager.js';

// --- HELPERS ---
const getLogX = (val, min, max, width, pad) => pad.l + ((Math.log(val||1) - Math.log(min||1)) / (Math.log(max) - Math.log(min||1))) * (width - pad.l - pad.r);
const getLinY = (val, min, max, height, pad) => height - pad.b - ((val - min) / (max - min)) * (height - pad.t - pad.b);
const formatPace = (val) => { const m = Math.floor(val); const s = Math.round((val - m) * 60); return `${m}:${s.toString().padStart(2,'0')}`; };
const formatPaceSec = (val) => { const m = Math.floor(val / 60); const s = Math.round(val % 60); return `${m}:${s.toString().padStart(2, '0')}`; };

export const FTPCharts = {
    
    // --- 1. SVG RENDERER (Power Curves) ---
    renderSvgCurve(data, options) {
        const { width = 600, height = 250, colorAll, color6w, xType } = options;
        const pad = { t: 20, b: 40, l: 40, r: 20 };
        const xVals = data.map(d => d.x);
        const yVals = data.flatMap(d => [d.yAll, d.y6w]).filter(v => v);
        
        if (!xVals.length) return '<div class="text-xs text-slate-500 p-4 text-center">No Data</div>';

        const minX = Math.min(...xVals), maxX = Math.max(...xVals);
        let minY = Math.min(...yVals), maxY = Math.max(...yVals);
        const buf = (maxY - minY) * 0.1; minY = Math.max(0, minY - buf); maxY += buf;

        let gridHtml = '';
        
        // Y-Axis
        for (let i = 0; i <= 4; i++) {
            const val = minY + (i/4 * (maxY - minY));
            const y = getLinY(val, minY, maxY, height, pad);
            const lbl = xType === 'distance' ? formatPace(val) : Math.round(val);
            gridHtml += `<line x1="${pad.l}" y1="${y}" x2="${width-pad.r}" y2="${y}" stroke="#334155" opacity="0.3"/><text x="${pad.l-5}" y="${y+3}" text-anchor="end" font-size="10" fill="#94a3b8">${lbl}</text>`;
        }

        // X-Axis
        let ticks = xType === 'time' 
            ? [{v:1,l:'1s'},{v:60,l:'1m'},{v:300,l:'5m'},{v:1200,l:'20m'},{v:3600,l:'1h'}] 
            : [{v:0.248,l:'400m'},{v:3.1,l:'5k'},{v:13.1,l:'Half'},{v:26.2,l:'Full'}];
        
        ticks.filter(t => t.v >= minX && t.v <= maxX).forEach(t => {
            const x = getLogX(t.v, minX, maxX, width, pad);
            gridHtml += `<line x1="${x}" y1="${pad.t}" x2="${x}" y2="${height-pad.b}" stroke="#334155" opacity="0.3"/><text x="${x}" y="${height-15}" text-anchor="middle" font-size="10" fill="#94a3b8">${t.l}</text>`;
        });

        const genPath = (key) => {
            let d = '';
            data.forEach((p, i) => {
                if (!p[key]) return;
                const x = getLogX(p.x, minX, maxX, width, pad);
                const y = getLinY(p[key], minY, maxY, height, pad);
                d += (i===0 || d==='') ? `M ${x} ${y}` : ` L ${x} ${y}`;
            });
            return d;
        };

        return `
        <div class="relative w-full h-full group select-none">
            <svg id="${options.containerId}-svg" viewBox="0 0 ${width} ${height}" class="w-full h-full cursor-crosshair" preserveAspectRatio="none">
                ${gridHtml}
                <path d="${genPath('y6w')}" fill="none" stroke="${color6w}" stroke-width="2" stroke-dasharray="4,4" opacity="0.7"/>
                <path d="${genPath('yAll')}" fill="none" stroke="${colorAll}" stroke-width="2"/>
                ${options.showPoints ? this._renderPoints(data, minX, maxX, minY, maxY, width, height, pad, colorAll, color6w) : ''}
                <line id="${options.containerId}-guide" x1="0" y1="${pad.t}" x2="0" y2="${height - pad.b}" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="4,4" opacity="0" style="pointer-events: none;" />
                <circle id="${options.containerId}-lock-dot" cx="0" cy="${pad.t}" r="3" fill="#ef4444" opacity="0" />
            </svg>
            <div id="${options.containerId}-tooltip" class="absolute hidden bg-slate-900/95 border border-slate-700 rounded shadow-xl p-3 z-50 min-w-[140px] pointer-events-none transition-all duration-75"></div>
        </div>`;
    },

    _renderPoints(data, minX, maxX, minY, maxY, width, height, pad, cAll, c6w) {
        let html = '';
        data.forEach(p => {
            const x = getLogX(p.x, minX, maxX, width, pad);
            if(p.yAll) html += `<circle cx="${x}" cy="${getLinY(p.yAll, minY, maxY, height, pad)}" r="3" fill="#0f172a" stroke="${cAll}" stroke-width="2" />`;
        });
        return html;
    },

    // --- 2. SVG INTERACTION (Hooks into TooltipManager logic) ---
    setupSvgInteractions(containerId, data, options) {
        const svg = document.getElementById(`${containerId}-svg`);
        const guide = document.getElementById(`${containerId}-guide`);
        const tooltip = document.getElementById(`${containerId}-tooltip`);
        if (!svg || !guide || !tooltip) return;

        const { width = 600, colorAll, color6w, xType } = options;
        const pad = { t: 20, b: 40, l: 40, r: 20 };
        const xVals = data.map(d => d.x);
        const minX = Math.min(...xVals), maxX = Math.max(...xVals);
        const lookup = data.map(d => ({ ...d, px: getLogX(d.x, minX, maxX, width, pad) }));

        svg.addEventListener('mousemove', (e) => {
            const rect = svg.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) * (width / rect.width);
            
            // Find closest point
            let closest = lookup[0], minDist = Infinity;
            for (const pt of lookup) {
                const dist = Math.abs(pt.px - mouseX);
                if (dist < minDist) { minDist = dist; closest = pt; }
            }

            if (closest && minDist < 50) {
                guide.setAttribute('x1', closest.px);
                guide.setAttribute('x2', closest.px);
                guide.style.opacity = '1';

                const label = closest.label || (xType === 'time' ? `${Math.floor(closest.x/60)}m` : `${closest.x.toFixed(1)}mi`);
                const valAll = xType === 'distance' ? formatPace(closest.yAll) : `${Math.round(closest.yAll)}w`;
                const val6w = closest.y6w ? (xType === 'distance' ? formatPace(closest.y6w) : `${Math.round(closest.y6w)}w`) : '--';

                // Use Standard HTML Structure
                tooltip.innerHTML = `
                    <div class="border-b border-slate-700 pb-1 mb-2">
                        <span class="text-[10px] font-bold text-slate-300 uppercase tracking-wider">${label}</span>
                    </div>
                    <div class="space-y-1">
                        <div class="flex justify-between items-center text-xs gap-3">
                            <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full" style="background:${colorAll}"></span><span class="text-slate-400">All Time</span></div>
                            <span class="font-mono text-white font-bold">${valAll}</span>
                        </div>
                        <div class="flex justify-between items-center text-xs gap-3">
                            <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full border border-slate-500" style="background:${color6w}"></span><span class="text-slate-400">6 Weeks</span></div>
                            <span class="font-mono text-white font-bold">${val6w}</span>
                        </div>
                    </div>`;

                tooltip.classList.remove('hidden');
                
                // Smart Position
                const relX = (closest.px / width) * rect.width;
                if (closest.px > width * 0.6) {
                    tooltip.style.left = 'auto';
                    tooltip.style.right = `${rect.width - relX + 15}px`;
                } else {
                    tooltip.style.right = 'auto';
                    tooltip.style.left = `${relX + 15}px`;
                }
            }
        });

        svg.addEventListener('mouseleave', () => {
            guide.style.opacity = '0';
            tooltip.classList.add('hidden');
        });
    },

    // --- 3. CHART.JS RENDERERS (Standardized) ---
    renderBikeHistory(canvasId, data, color) {
        const ctx = document.getElementById(canvasId);
        if (!ctx || !data.length) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.date),
                datasets: [
                    { 
                        label: 'FTP', 
                        data: data.map(d => d.ftp), 
                        borderColor: color, 
                        backgroundColor: color+'20', 
                        borderWidth: 2, 
                        pointRadius: 0,        // Invisible
                        pointHitRadius: 10,    // Easy to grab
                        pointHoverRadius: 4,   // Visible on hover
                        tension: 0.2,
                        yAxisID: 'y' 
                    },
                    { 
                        label: 'W/kg', 
                        data: data.map(d => d.wkg), 
                        borderColor: '#34d399', 
                        borderWidth: 1.5, 
                        borderDash: [3,3], 
                        pointRadius: 0, 
                        pointHitRadius: 10,
                        pointHoverRadius: 4,
                        tension: 0.2,
                        yAxisID: 'y1' 
                    }
                ]
            },
            options: this._getCommonOptions({
                y: { position: 'left', grid: { color: '#334155' }, ticks: { color: '#94a3b8' }, suggestedMin: 150 },
                y1: { position: 'right', grid: { display: false }, ticks: { color: '#34d399' }, suggestedMin: 2.0 }
            })
        });
    },

    renderRunHistory(canvasId, data, color) {
        const ctx = document.getElementById(canvasId);
        if (!ctx || !data.length) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.date),
                datasets: [
                    { 
                        label: 'Pace', 
                        data: data.map(d => d.pace), 
                        borderColor: color, 
                        backgroundColor: color+'20', 
                        borderWidth: 2, 
                        pointRadius: 0,        // Invisible
                        pointHitRadius: 10,    // Easy to grab
                        pointHoverRadius: 4,   // Visible on hover
                        tension: 0.2,
                        yAxisID: 'y' 
                    },
                    { 
                        label: 'LTHR', 
                        data: data.map(d => d.lthr), 
                        borderColor: '#ef4444', 
                        borderWidth: 1, 
                        borderDash: [3,3], 
                        pointRadius: 0, 
                        pointHitRadius: 10,
                        pointHoverRadius: 4,
                        tension: 0.2,
                        yAxisID: 'y1' 
                    }
                ]
            },
            options: this._getCommonOptions({
                y: { position: 'left', grid: { color: '#334155' }, ticks: { color: '#94a3b8', callback: formatPaceSec }, reverse: true },
                y1: { position: 'right', grid: { display: false }, ticks: { color: '#ef4444' }, suggestedMin: 130 }
            })
        });
    },

    _getCommonOptions(scales) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: { 
                x: { display: true, ticks: { maxTicksLimit: 6, color: '#64748b', font: { size: 10 } }, grid: { display: false } }, 
                ...scales 
            },
            plugins: {
                legend: { display: false },
                // Use TooltipManager if available, otherwise use strict fallback
                tooltip: window.TooltipManager && window.TooltipManager.createChartConfig 
                    ? window.TooltipManager.createChartConfig().tooltip 
                    : this._getExternalTooltipConfig()
            }
        };
    },

    _getExternalTooltipConfig() {
        return {
            enabled: false,
            external: (context) => {
                let tooltipEl = document.getElementById('chartjs-tooltip');
                if (!tooltipEl) {
                    tooltipEl = document.createElement('div');
                    tooltipEl.id = 'chartjs-tooltip';
                    tooltipEl.className = 'bg-slate-900/95 border border-slate-700 rounded shadow-xl p-3 z-50 min-w-[140px] pointer-events-none absolute transition-all duration-100';
                    document.body.appendChild(tooltipEl);
                }

                const tooltipModel = context.tooltip;
                if (tooltipModel.opacity === 0) {
                    tooltipEl.style.opacity = 0;
                    return;
                }

                if (tooltipModel.body) {
                    const title = tooltipModel.title || [];
                    const bodyLines = tooltipModel.body.map(b => b.lines);

                    let innerHtml = `<div class="border-b border-slate-700 pb-1 mb-2 text-[10px] font-bold text-slate-300 uppercase tracking-wider">${title}</div><div class="space-y-1">`;

                    bodyLines.forEach((body, i) => {
                        const colors = tooltipModel.labelColors[i];
                        const style = `background:${colors.borderColor}`;
                        let val = body[0].split(':')[1] || '';
                        
                        // Fix for Pace formatting in tooltip
                        if(context.chart.scales.y.options.reverse && context.tooltip.dataPoints[i].datasetIndex === 0) {
                            val = formatPaceSec(context.tooltip.dataPoints[i].raw);
                        }

                        innerHtml += `
                        <div class="flex justify-between items-center text-xs gap-3">
                            <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full" style="${style}"></span><span class="text-slate-400">${body[0].split(':')[0]}</span></div>
                            <span class="font-mono text-white font-bold">${val}</span>
                        </div>`;
                    });
                    innerHtml += `</div>`;

                    tooltipEl.innerHTML = innerHtml;
                }

                const position = context.chart.canvas.getBoundingClientRect();
                tooltipEl.style.opacity = 1;
                tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
                tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
            }
        };
    }
};
