// js/views/ftp/charts.js

// --- SVG HELPERS ---
const getLogX = (val, min, max, width, pad) => pad.l + ((Math.log(val||1) - Math.log(min||1)) / (Math.log(max) - Math.log(min||1))) * (width - pad.l - pad.r);
const getLinY = (val, min, max, height, pad) => height - pad.b - ((val - min) / (max - min)) * (height - pad.t - pad.b);
const formatPace = (val) => { const m = Math.floor(val); const s = Math.round((val - m) * 60); return `${m}:${s.toString().padStart(2,'0')}`; };
const formatPaceSec = (val) => { const m = Math.floor(val / 60); const s = Math.round(val % 60); return `${m}:${s.toString().padStart(2, '0')}`; };

export const FTPCharts = {
    
    // 1. SVG Power Curve Renderer
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

        return `<svg viewBox="0 0 ${width} ${height}" class="w-full h-full" preserveAspectRatio="none">${gridHtml}<path d="${genPath('y6w')}" fill="none" stroke="${color6w}" stroke-width="2" stroke-dasharray="4,4" opacity="0.7"/><path d="${genPath('yAll')}" fill="none" stroke="${colorAll}" stroke-width="2"/></svg>`;
    },

    // 2. Chart.js History Renderers
    renderBikeHistory(canvasId, data, color) {
        const ctx = document.getElementById(canvasId);
        if (!ctx || !data.length) return;

        const dates = data.map(d => d.date);
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    { label: 'FTP (w)', data: data.map(d => d.ftp), borderColor: color, backgroundColor: color+'20', borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, yAxisID: 'y' },
                    { label: 'W/kg', data: data.map(d => d.wkg), borderColor: '#34d399', borderWidth: 1.5, borderDash: [3,3], pointRadius: 0, pointHoverRadius: 4, yAxisID: 'y1' }
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

        const dates = data.map(d => d.date);
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    { label: 'Pace', data: data.map(d => d.pace), borderColor: color, backgroundColor: color+'20', borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, yAxisID: 'y' },
                    { label: 'LTHR', data: data.map(d => d.lthr), borderColor: '#ef4444', borderWidth: 1, borderDash: [3,3], pointRadius: 0, pointHoverRadius: 4, yAxisID: 'y1' }
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
            scales: { x: { display: true, ticks: { maxTicksLimit: 6, color: '#64748b' }, grid: { display: false } }, ...scales },
            plugins: { legend: { display: false } }
        };
    }
};
