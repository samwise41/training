import { TooltipManager } from '../../utils/tooltipManager.js';
import { KEY_DISTANCES } from './data.js';

// --- HELPERS ---
const getLogX = (val, min, max, width, pad) => pad.l + ((Math.log(val||1) - Math.log(min||1)) / (Math.log(max) - Math.log(min||1))) * (width - pad.l - pad.r);
const getLinY = (val, min, max, height, pad) => height - pad.b - ((val - min) / (max - min)) * (height - pad.t - pad.b);
const formatPace = (val) => { 
    if (!val) return '--';
    const m = Math.floor(val); 
    const s = Math.round((val - m) * 60); 
    return `${m}:${s.toString().padStart(2,'0')}`; 
};
const formatPaceSec = (val) => { 
    if (!val) return '--';
    const m = Math.floor(val / 60); 
    const s = Math.round(val % 60); 
    return `${m}:${s.toString().padStart(2, '0')}`; 
};

// Custom Chart.js Plugin for Vertical Guide
const verticalLinePlugin = {
    id: 'verticalLine',
    afterDraw: (chart) => {
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
            ctx.strokeStyle = '#475569';
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.restore();
        }
    }
};

export const FTPCharts = {
    
    renderSvgCurve(data, options) {
        const { width = 600, height = 250, colorAll, color6w, xType } = options;
        const pad = { t: 20, b: 40, l: 45, r: 20 }; // Increased left pad for pace labels
        const xVals = data.map(d => d.x);
        const yVals = data.flatMap(d => [d.yAll, d.y6w]).filter(v => v);
        
        if (!xVals.length) return '<div class="text-xs text-slate-500 p-4 text-center">No Data</div>';

        const minX = Math.min(...xVals), maxX = Math.max(...xVals);
        let minY = Math.min(...yVals), maxY = Math.max(...yVals);
        
        const buf = (maxY - minY) * 0.1; 
        minY = Math.max(0, minY - buf); 
        maxY += buf;

        let gridHtml = '';
        
        // Y-Axis Grid (Fix: Added proper formatting for Pace)
        for (let i = 0; i <= 4; i++) {
            const val = minY + (i/4 * (maxY - minY));
            const y = getLinY(val, minY, maxY, height, pad);
            const lbl = xType === 'distance' ? formatPace(val) : Math.round(val);
            gridHtml += `
                <line x1="${pad.l}" y1="${y}" x2="${width-pad.r}" y2="${y}" stroke="#334155" opacity="0.3"/>
                <text x="${pad.l-8}" y="${y+3}" text-anchor="end" class="font-mono" style="font-size: 10px; fill: #64748b;">${lbl}</text>`;
        }

        // X-Axis Grid
        let ticks = (xType === 'time') 
            ? [{v:1,l:'1s'},{v:5,l:'5s'},{v:30,l:'30s'},{v:60,l:'1m'},{v:300,l:'5m'},{v:1200,l:'20m'},{v:3600,l:'1h'}]
            : KEY_DISTANCES.map(d => ({ v: d.val, l: d.label }));
        
        ticks.filter(t => t.v >= minX * 0.9 && t.v <= maxX * 1.1).forEach(t => {
            const x = getLogX(t.v, minX, maxX, width, pad);
            if (x >= pad.l && x <= width - pad.r) {
                gridHtml += `
                    <line x1="${x}" y1="${pad.t}" x2="${x}" y2="${height-pad.b}" stroke="#334155" opacity="0.3"/>
                    <text x="${x}" y="${height-15}" text-anchor="middle" class="font-mono" style="font-size: 10px; fill: #64748b;">${t.l}</text>`;
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
                <path d="${genPath('y6w')}" fill="none" stroke="${color6w}" stroke-width="2" stroke-dasharray="4,4" opacity="0.6"/>
                <path d="${genPath('yAll')}" fill="none" stroke="${colorAll}" stroke-width="2.5"/>
                <line id="${options.containerId}-guide" x1="0" y1="${pad.t}" x2="0" y2="${height - pad.b}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4,4" opacity="0" style="pointer-events: none;" />
            </svg>
        </div>`;
    },

    setupSvgInteractions(containerId, data, options) {
        const svg = document.getElementById(`${containerId}-svg`);
        const guide = document.getElementById(`${containerId}-guide`);
        if (!svg || !guide) return;

        const { width = 600, colorAll, color6w, xType } = options;
        const pad = { t: 20, b: 40, l: 45, r: 20 };
        const minX = Math.min(...data.map(d => d.x)), maxX = Math.max(...data.map(d => d.x));
        const lookup = data.map(d => ({ ...d, px: getLogX(d.x, minX, maxX, width, pad) }));

        svg.addEventListener('mousemove', (e) => {
            const rect = svg.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) * (width / rect.width);
            
            let closest = lookup[0], minDist = Infinity;
            for (const pt of lookup) {
                const dist = Math.abs(pt.px - mouseX);
                if (dist < minDist) { minDist = dist; closest = pt; }
            }

            if (closest && minDist < 40) {
                guide.setAttribute('x1', closest.px);
                guide.setAttribute('x2', closest.px);
                guide.style.opacity = '1';

                const label = closest.label || (xType === 'time' ? formatPaceSec(closest.x) : `${closest.x.toFixed(1)}mi`);
                const valAll = xType === 'distance' ? formatPace(closest.yAll) : `${Math.round(closest.yAll)}w`;
                const val6w = closest.y6w ? (xType === 'distance' ? formatPace(closest.y6w) : `${Math.round(closest.y6w)}w`) : '--';

                const html = `
                    <div class="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-2">${label}</div>
                    <div class="space-y-1.5">
                        <div class="flex justify-between gap-4">
                            <span class="text-slate-400">All Time (${closest.dateAll||'--'})</span>
                            <span class="font-mono text-white font-bold">${valAll}</span>
                        </div>
                        <div class="flex justify-between gap-4">
                            <span class="text-slate-400">6 Weeks (${closest.date6w||'--'})</span>
                            <span class="font-mono text-white font-bold">${val6w}</span>
                        </div>
                    </div>`;
                
                TooltipManager.show(svg, html, e);
            }
        });

        svg.addEventListener('mouseleave', () => {
            guide.style.opacity = '0';
            TooltipManager.hide();
        });
    },

    renderBikeHistory(canvasId, data, color) {
        const ctx = document.getElementById(canvasId);
        if (!ctx || !data.length) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.date),
                datasets: [
                    { 
                        label: 'Watts', data: data.map(d => d.ftp), 
                        borderColor: color, backgroundColor: color+'15', 
                        borderWidth: 2, pointRadius: 0, tension: 0.15, yAxisID: 'y' 
                    },
                    { 
                        label: 'W/kg', data: data.map(d => d.wkg), 
                        borderColor: '#10b981', borderWidth: 2, 
                        pointRadius: 0, tension: 0.15, yAxisID: 'y1' 
                    }
                ]
            },
            options: this._getCommonOptions({
                y: { 
                    type: 'linear', position: 'left',
                    title: { display: true, text: 'Watts', color: color, font: { size: 9, weight: 'bold' } },
                    grid: { color: '#334155' }, 
                    ticks: { color: '#94a3b8', font: { family: 'monospace' } } 
                },
                y1: { 
                    type: 'linear', position: 'right',
                    title: { display: true, text: 'W/kg', color: '#10b981', font: { size: 9, weight: 'bold' } },
                    grid: { display: false }, 
                    ticks: { color: '#10b981', font: { family: 'monospace' } } 
                }
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
                        borderColor: color, backgroundColor: color+'15', 
                        borderWidth: 2, pointRadius: 0, tension: 0.15, yAxisID: 'y' 
                    },
                    { 
                        label: 'LTHR', data: data.map(d => d.lthr), 
                        borderColor: '#ef4444', borderWidth: 2, borderDash: [4,2],
                        pointRadius: 0, tension: 0.15, yAxisID: 'y1' 
                    }
                ]
            },
            options: this._getCommonOptions({
                y: { 
                    type: 'linear', position: 'left', reverse: true,
                    title: { display: true, text: 'Pace', color: color, font: { size: 9, weight: 'bold' } },
                    grid: { color: '#334155' }, 
                    ticks: { color: '#94a3b8', font: { family: 'monospace' }, callback: formatPaceSec } 
                },
                y1: { 
                    type: 'linear', position: 'right',
                    title: { display: true, text: 'BPM', color: '#ef4444', font: { size: 9, weight: 'bold' } },
                    grid: { display: false }, 
                    ticks: { color: '#ef4444', font: { family: 'monospace' } } 
                }
            }),
            plugins: [verticalLinePlugin]
        });
    },

    _getCommonOptions(scales) {
        return {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: { 
                x: { 
                    ticks: { maxTicksLimit: 8, color: '#64748b', font: { size: 9, family: 'monospace' } }, 
                    grid: { display: false } 
                }, 
                ...scales 
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: false,
                    external: (context) => {
                        const { chart, tooltip } = context;
                        if (tooltip.opacity === 0) { TooltipManager.hide(); return; }

                        const date = tooltip.title[0];
                        let itemsHtml = `<div class="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-2">${date}</div>`;
                        
                        tooltip.dataPoints.forEach(dp => {
                            let val = dp.formattedValue;
                            if (dp.dataset.label === 'Pace') val = formatPaceSec(dp.raw);
                            itemsHtml += `
                                <div class="flex justify-between gap-6 items-center mb-1">
                                    <span style="color:${dp.dataset.borderColor}" class="text-[10px] font-bold uppercase">${dp.dataset.label}</span>
                                    <span class="font-mono text-white">${val}</span>
                                </div>`;
                        });

                        TooltipManager.show(chart.canvas, itemsHtml, { clientX: tooltip.caretX + chart.canvas.getBoundingClientRect().left, clientY: tooltip.caretY });
                    }
                }
            }
        };
    }
};
