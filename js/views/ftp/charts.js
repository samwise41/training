import { TooltipManager } from '../../utils/tooltipManager.js';
import { KEY_DISTANCES } from './data.js';

// --- HELPERS ---
const getLogX = (val, min, max, width, pad) => pad.l + ((Math.log(val||1) - Math.log(min||1)) / (Math.log(max) - Math.log(min||1))) * (width - pad.l - pad.r);
const getLinY = (val, min, max, height, pad) => height - pad.b - ((val - min) / (max - min)) * (height - pad.t - pad.b);
const formatPace = (val) => { const m = Math.floor(val); const s = Math.round((val - m) * 60); return `${m}:${s.toString().padStart(2,'0')}`; };
const formatPaceSec = (val) => { const m = Math.floor(val / 60); const s = Math.round(val % 60); return `${m}:${s.toString().padStart(2, '0')}`; };

// --- CUSTOM PLUGIN: Vertical Line for Chart.js ---
const verticalLinePlugin = {
    id: 'verticalLine',
    afterDraw: (chart) => {
        // Only draw if we have an active tooltip/hover state
        if (chart.tooltip?._active?.length) {
            const ctx = chart.ctx;
            ctx.save();
            const activePoint = chart.tooltip._active[0];
            const x = activePoint.element.x;
            const topY = chart.scales.y.top;
            const bottomY = chart.scales.y.bottom;
            
            ctx.beginPath();
            ctx.moveTo(x, topY);
            ctx.lineTo(x, bottomY);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#cbd5e1'; // matches SVG guide stroke
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.restore();
        }
    }
};

export const FTPCharts = {
    
    // --- 1. SVG RENDERER ---
    renderSvgCurve(data, options) {
        const { width = 600, height = 250, colorAll, color6w, xType } = options;
        const pad = { t: 20, b: 40, l: 40, r: 20 };
        const xVals = data.map(d => d.x);
        const yVals = data.flatMap(d => [d.yAll, d.y6w]).filter(v => v);
        
        if (!xVals.length) return '<div class="text-xs text-slate-500 p-4 text-center">No Data</div>';

        const minX = Math.min(...xVals), maxX = Math.max(...xVals);
        let minY = Math.min(...yVals), maxY = Math.max(...yVals);
        
        const buf = (maxY - minY) * 0.1; 
        minY = Math.max(0, minY - buf); 
        maxY += buf;

        let gridHtml = '';
        
        // Y-Axis Grid
        for (let i = 0; i <= 4; i++) {
            const val = minY + (i/4 * (maxY - minY));
            const y = getLinY(val, minY, maxY, height, pad);
            const lbl = xType === 'distance' ? formatPace(val) : Math.round(val);
            gridHtml += `<line x1="${pad.l}" y1="${y}" x2="${width-pad.r}" y2="${y}" stroke="#334155" opacity="0.3"/><text x="${pad.l-5}" y="${y+3}" text-anchor="end" font-size="10" fill="#94a3b8">${lbl}</text>`;
        }

        // X-Axis Grid
        let ticks = [];
        if (xType === 'time') {
            ticks = [{v:1,l:'1s'},{v:5,l:'5s'},{v:30,l:'30s'},{v:60,l:'1m'},{v:300,l:'5m'},{v:1200,l:'20m'},{v:3600,l:'1h'}];
        } else {
            ticks = KEY_DISTANCES.map(d => ({ v: d.val, l: d.label }));
        }
        
        ticks.filter(t => t.v >= minX * 0.9 && t.v <= maxX * 1.1).forEach(t => {
            const x = getLogX(t.v, minX, maxX, width, pad);
            if (x >= pad.l && x <= width - pad.r) {
                gridHtml += `<line x1="${x}" y1="${pad.t}" x2="${x}" y2="${height-pad.b}" stroke="#334155" opacity="0.3"/><text x="${x}" y="${height-15}" text-anchor="middle" font-size="10" fill="#94a3b8">${t.l}</text>`;
            }
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
                <circle id="${options.containerId}-lock-dot" cx="0" cy="${height-pad.b}" r="3" fill="#ef4444" opacity="0" style="pointer-events: none;" />
            </svg>
            <div id="${options.containerId}-tooltip" class="absolute hidden bg-slate-900/95 border border-slate-600 rounded shadow-xl p-0 z-50 min-w-[220px] pointer-events-none transition-all duration-75 text-xs"></div>
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

    // --- 2. SVG INTERACTION (Sticky Tooltip) ---
    setupSvgInteractions(containerId, data, options) {
        const svg = document.getElementById(`${containerId}-svg`);
        const guide = document.getElementById(`${containerId}-guide`);
        const lockDot = document.getElementById(`${containerId}-lock-dot`);
        const tooltip = document.getElementById(`${containerId}-tooltip`);
        if (!svg || !guide || !tooltip) return;

        const { width = 600, colorAll, color6w, xType } = options;
        const pad = { t: 20, b: 40, l: 40, r: 20 };
        const minX = Math.min(...data.map(d => d.x)), maxX = Math.max(...data.map(d => d.x));
        const lookup = data.map(d => ({ ...d, px: getLogX(d.x, minX, maxX, width, pad) }));

        let isLocked = false;

        const updateTooltip = (clientX) => {
            const rect = svg.getBoundingClientRect();
            const mouseX = (clientX - rect.left) * (width / rect.width);
            
            let closest = lookup[0], minDist = Infinity;
            for (const pt of lookup) {
                const dist = Math.abs(pt.px - mouseX);
                if (dist < minDist) { minDist = dist; closest = pt; }
            }

            if (closest && (isLocked || minDist < 50)) {
                guide.setAttribute('x1', closest.px);
                guide.setAttribute('x2', closest.px);
                guide.style.opacity = '1';
                
                // Show Lock Dot if locked
                if(isLocked) {
                    lockDot.setAttribute('cx', closest.px);
                    lockDot.style.opacity = '1';
                } else {
                    lockDot.style.opacity = '0';
                }

                const label = closest.label || (xType === 'time' ? `${Math.floor(closest.x/60)}m ${Math.floor(closest.x%60)}s` : `${closest.x.toFixed(1)}mi`);
                const valAll = xType === 'distance' ? formatPace(closest.yAll) : `${Math.round(closest.yAll)}w`;
                const val6w = closest.y6w ? (xType === 'distance' ? formatPace(closest.y6w) : `${Math.round(closest.y6w)}w`) : '--';
                const dateAll = closest.dateAll || '--';
                const date6w = closest.date6w || '--';

                tooltip.innerHTML = `
                    <div class="px-3 py-2 border-b border-slate-700 bg-slate-800/50 rounded-t">
                        <span class="font-bold text-slate-200">${label}</span>
                    </div>
                    <div class="p-3 space-y-2">
                        <div class="grid grid-cols-[auto_1fr_auto] gap-4 items-center">
                            <div class="flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full" style="background:${colorAll}"></span>
                                <span class="text-slate-400">All Time</span>
                            </div>
                            <span class="font-mono text-slate-500 text-[10px] text-center truncate">${dateAll}</span>
                            <span class="font-mono text-white font-bold text-sm text-right">${valAll}</span>
                        </div>
                        <div class="grid grid-cols-[auto_1fr_auto] gap-4 items-center">
                            <div class="flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full border border-slate-500" style="background:${color6w}"></span>
                                <span class="text-slate-400">6 Weeks</span>
                            </div>
                            <span class="font-mono text-slate-500 text-[10px] text-center truncate">${date6w}</span>
                            <span class="font-mono text-white font-bold text-sm text-right">${val6w}</span>
                        </div>
                    </div>`;

                tooltip.classList.remove('hidden');
                
                const relX = (closest.px / width) * rect.width;
                if (closest.px > width * 0.6) {
                    tooltip.style.left = 'auto';
                    tooltip.style.right = `${rect.width - relX + 15}px`;
                } else {
                    tooltip.style.right = 'auto';
                    tooltip.style.left = `${relX + 15}px`;
                }
                tooltip.style.top = '10px'; 
            }
        };

        svg.addEventListener('click', (e) => {
            isLocked = true; // Lock it
            updateTooltip(e.clientX);
        });

        svg.addEventListener('mousemove', (e) => {
            if (!isLocked) updateTooltip(e.clientX);
        });

        svg.addEventListener('mouseleave', () => {
            if (!isLocked) {
                guide.style.opacity = '0';
                tooltip.classList.add('hidden');
                lockDot.style.opacity = '0';
            }
        });
    },

    // --- 3. CHART.JS RENDERERS (Clean Lines + Vertical Guide) ---
    renderBikeHistory(canvasId, data, color) {
        const ctx = document.getElementById(canvasId);
        if (!ctx || !data.length) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.date),
                datasets: [
                    { 
                        label: 'FTP', data: data.map(d => d.ftp), 
                        borderColor: color, backgroundColor: color+'20', 
                        pointBackgroundColor: color,
                        borderWidth: 2, pointRadius: 0, pointHitRadius: 10, pointHoverRadius: 4, 
                        tension: 0.2, yAxisID: 'y' 
                    },
                    { 
                        label: 'W/kg', data: data.map(d => d.wkg), 
                        borderColor: '#34d399', borderWidth: 2, 
                        pointBackgroundColor: '#34d399',
                        pointRadius: 0, pointHitRadius: 10, pointHoverRadius: 4, 
                        tension: 0.2, yAxisID: 'y1' 
                    }
                ]
            },
            options: this._getCommonOptions({
                y: { position: 'left', grid: { color: '#334155' }, ticks: { color: '#94a3b8' }, suggestedMin: 150 },
                y1: { position: 'right', grid: { display: false }, ticks: { color: '#34d399' }, suggestedMin: 2.0 }
            }),
            plugins: [verticalLinePlugin]
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
                        label: 'Pace', data: data.map(d => d.pace), 
                        borderColor: color, backgroundColor: color+'20', 
                        pointBackgroundColor: color,
                        borderWidth: 2, pointRadius: 0, pointHitRadius: 10, pointHoverRadius: 4, 
                        tension: 0.2, yAxisID: 'y' 
                    },
                    { 
                        label: 'LTHR', data: data.map(d => d.lthr), 
                        borderColor: '#ef4444', borderWidth: 1, borderDash: [3,3], 
                        pointBackgroundColor: '#ef4444',
                        pointRadius: 0, pointHitRadius: 10, pointHoverRadius: 4, 
                        tension: 0.2, yAxisID: 'y1' 
                    }
                ]
            },
            options: this._getCommonOptions({
                y: { position: 'left', grid: { color: '#334155' }, ticks: { color: '#94a3b8', callback: formatPaceSec }, reverse: true },
                y1: { position: 'right', grid: { display: false }, ticks: { color: '#ef4444' }, suggestedMin: 130 }
            }),
            plugins: [verticalLinePlugin]
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
                tooltip: {
                    enabled: false, 
                    external: (context) => {
                        const tooltipModel = context.tooltip;
                        
                        let tooltipEl = document.getElementById('chartjs-tooltip');
                        if (!tooltipEl) {
                            tooltipEl = document.createElement('div');
                            tooltipEl.id = 'chartjs-tooltip';
                            tooltipEl.className = 'absolute bg-slate-900/95 border border-slate-600 rounded shadow-xl pointer-events-none transition-all duration-75 text-xs z-50 min-w-[200px]';
                            document.body.appendChild(tooltipEl);
                        }

                        if (tooltipModel.opacity === 0) {
                            tooltipEl.style.opacity = 0;
                            return;
                        }

                        if (tooltipModel.body) {
                            const dateStr = tooltipModel.title || '';
                            let innerHtml = `
                                <div class="px-3 py-2 border-b border-slate-700 bg-slate-800/50 rounded-t">
                                    <span class="font-bold text-slate-200">History</span>
                                </div>
                                <div class="p-3 space-y-2">`;

                            tooltipModel.dataPoints.forEach(dp => {
                                const ds = context.chart.data.datasets[dp.datasetIndex];
                                let val = dp.formattedValue;
                                if(ds.label === 'Pace') val = formatPaceSec(dp.raw);

                                innerHtml += `
                                    <div class="grid grid-cols-[auto_1fr_auto] gap-4 items-center">
                                        <div class="flex items-center gap-2">
                                            <span class="w-2 h-2 rounded-full" style="background:${ds.borderColor}"></span>
                                            <span class="text-slate-400">${ds.label}</span>
                                        </div>
                                        <span class="font-mono text-slate-500 text-[10px] text-center">${dateStr}</span>
                                        <span class="font-mono text-white font-bold text-sm text-right">${val}</span>
                                    </div>`;
                            });

                            innerHtml += `</div>`;
                            tooltipEl.innerHTML = innerHtml;
                        }

                        const position = context.chart.canvas.getBoundingClientRect();
                        const tooltipX = position.left + window.pageXOffset + tooltipModel.caretX;
                        const tooltipY = position.top + window.pageYOffset + tooltipModel.caretY - 10; 

                        // Smart Positioning: Flip left if on right side
                        let leftPos = tooltipX;
                        let transform = 'translate(-50%, -100%)'; // Default: Center Above

                        if (tooltipModel.caretX > context.chart.width * 0.6) {
                            leftPos = tooltipX - 10; // Shift slightly left of cursor
                            transform = 'translate(-100%, -100%)'; // Anchor bottom-right corner
                        } else {
                            leftPos = tooltipX + 10; // Shift slightly right of cursor
                            transform = 'translate(0, -100%)'; // Anchor bottom-left corner
                        }

                        tooltipEl.style.opacity = 1;
                        tooltipEl.style.left = leftPos + 'px';
                        tooltipEl.style.top = tooltipY + 'px';
                        tooltipEl.style.transform = transform;
                        tooltipEl.style.pointerEvents = 'none';
                    }
                }
            }
        };
    }
};
