import { Formatters } from '../../utils/formatting.js';

// --- 1. GLOBAL HANDLERS (Tooltip Logic) ---

// FTP History Tooltip (Updated to match Power Curve style)
window.handleFTPClick = (e, date, ftp, weight, wkg, source) => {
    if (window.TooltipManager) {
        e.stopPropagation();
        
        // Define color based on source
        const isZwift = source.toLowerCase().includes('zwift');
        const colorClass = isZwift ? 'text-orange-400' : 'text-emerald-400';
        const borderColor = isZwift ? 'border-orange-500/30' : 'border-emerald-500/30';
        
        const html = `
            <div class="min-w-[180px]">
                <div class="flex items-center justify-between border-b ${borderColor} pb-2 mb-2">
                    <span class="text-xs font-bold text-slate-200">${date}</span>
                    <i class="fa-solid fa-bolt ${colorClass} text-xs"></i>
                </div>
                
                <div class="flex justify-between items-end mb-1">
                    <span class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">FTP</span>
                    <span class="text-lg font-bold text-white">${ftp} <span class="text-[10px] text-slate-500">w</span></span>
                </div>

                <div class="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-700/50">
                    <div>
                        <div class="text-[9px] text-slate-500 uppercase">Ratio</div>
                        <div class="text-xs font-mono ${colorClass}">${wkg} w/kg</div>
                    </div>
                    <div class="text-right">
                        <div class="text-[9px] text-slate-500 uppercase">Weight</div>
                        <div class="text-xs font-mono text-slate-300">${weight} kg</div>
                    </div>
                </div>
                
                <div class="mt-2 text-[9px] text-right italic text-slate-500">
                    via ${source}
                </div>
            </div>
        `;
        window.TooltipManager.show(e.currentTarget, html, e);
    }
};

// Power Curve Tooltip (Now includes Date)
window.handlePowerCurveClick = (e, durationLabel, power, wkg, date) => {
    if (window.TooltipManager) {
        e.stopPropagation();
        const html = `
            <div class="min-w-[160px]">
                <div class="flex items-center justify-between border-b border-blue-500/30 pb-2 mb-2">
                    <span class="text-xs font-bold text-slate-200">${durationLabel}</span>
                    <span class="text-[9px] text-slate-400 font-mono">${date}</span>
                </div>

                <div class="flex justify-between items-end mb-1">
                    <span class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Power</span>
                    <span class="text-lg font-bold text-blue-400">${power} <span class="text-[10px] text-slate-500">w</span></span>
                </div>

                <div class="flex justify-between items-end mt-1">
                    <span class="text-[10px] text-slate-500 uppercase">Intensity</span>
                    <span class="text-xs font-mono text-slate-300">${wkg} w/kg</span>
                </div>
            </div>
        `;
        window.TooltipManager.show(e.currentTarget, html, e);
    }
};


// --- 2. CHART RENDERERS ---

export const renderFTPHistoryChart = (history) => {
    if (!history || history.length < 2) return '<div class="p-8 text-center text-slate-500 italic">Not enough FTP history data</div>';

    // Sort by date ascending
    const data = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));

    const width = 800;
    const height = 300;
    const pad = { t: 20, b: 40, l: 50, r: 20 };

    // Scales
    const dates = data.map(d => new Date(d.date).getTime());
    const ftps = data.map(d => d.ftp);
    
    const minTime = Math.min(...dates);
    const maxTime = Math.max(...dates);
    const minFtp = Math.min(...ftps) * 0.9;
    const maxFtp = Math.max(...ftps) * 1.1;

    const getX = (dateStr) => {
        const t = new Date(dateStr).getTime();
        return pad.l + ((t - minTime) / (maxTime - minTime)) * (width - pad.l - pad.r);
    };

    const getY = (val) => {
        return height - pad.b - ((val - minFtp) / (maxFtp - minFtp)) * (height - pad.t - pad.b);
    };

    // Generate Path
    let pathD = `M ${getX(data[0].date)} ${getY(data[0].ftp)}`;
    let pointsHtml = '';
    let areaPathD = pathD;

    data.forEach((d, i) => {
        const x = getX(d.date);
        const y = getY(d.ftp);
        
        if (i > 0) {
            // Step chart logic (optional, linear is fine for FTP usually, but let's stick to linear)
            pathD += ` L ${x} ${y}`;
            areaPathD += ` L ${x} ${y}`;
        }

        // Tooltip Data Prep
        const wkg = (d.ftp / d.weight).toFixed(2);
        
        // Point
        pointsHtml += `
            <circle cx="${x}" cy="${y}" r="4" 
                fill="#0f172a" stroke="#34d399" stroke-width="2"
                class="cursor-pointer hover:stroke-white hover:scale-125 transition-all z-10 relative"
                onclick="window.handleFTPClick(event, '${d.date}', '${d.ftp}', '${d.weight}', '${wkg}', '${d.source}')"
            />`;
    });

    // Close Area for gradient
    areaPathD += ` L ${getX(data[data.length-1].date)} ${height - pad.b} L ${getX(data[0].date)} ${height - pad.b} Z`;

    return `
        <div class="relative w-full h-[300px] select-none">
            <svg viewBox="0 0 ${width} ${height}" class="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="ftpGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stop-color="#34d399" stop-opacity="0.2"/>
                        <stop offset="100%" stop-color="#34d399" stop-opacity="0"/>
                    </linearGradient>
                </defs>
                
                <line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${height - pad.b}" stroke="#334155" stroke-width="1" />
                <line x1="${pad.l}" y1="${height - pad.b}" x2="${width - pad.r}" y2="${height - pad.b}" stroke="#334155" stroke-width="1" />
                
                <text x="${pad.l - 10}" y="${getY(maxFtp)}" text-anchor="end" fill="#94a3b8" font-size="10">${Math.round(maxFtp)}w</text>
                <text x="${pad.l - 10}" y="${getY(minFtp)}" text-anchor="end" fill="#94a3b8" font-size="10">${Math.round(minFtp)}w</text>

                <path d="${areaPathD}" fill="url(#ftpGradient)" stroke="none" />
                <path d="${pathD}" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                
                ${pointsHtml}
            </svg>
        </div>
    `;
};

export const renderPowerCurve = (curveData, weight = 75) => {
    if (!curveData || curveData.length === 0) return '<div class="p-8 text-center text-slate-500 italic">No Power Curve Data</div>';

    const width = 800;
    const height = 300;
    const pad = { t: 20, b: 30, l: 50, r: 20 };

    // Logarithmic Scale Logic for X-Axis (Duration)
    const minDur = 1; // 1 second
    const maxDur = Math.max(...curveData.map(d => d.duration));
    
    // Y-Axis (Watts)
    const maxWatts = Math.max(...curveData.map(d => d.watts)) * 1.1;
    
    const getX = (sec) => {
        // Simple log scale: x = log(sec)
        const logMin = Math.log(minDur);
        const logMax = Math.log(maxDur);
        const logVal = Math.log(sec);
        return pad.l + ((logVal - logMin) / (logMax - logMin)) * (width - pad.l - pad.r);
    };

    const getY = (watts) => {
        return height - pad.b - (watts / maxWatts) * (height - pad.t - pad.b);
    };

    let pathD = '';
    let pointsHtml = '';

    curveData.forEach((d, i) => {
        const x = getX(d.duration);
        const y = getY(d.watts);
        
        pathD += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);

        // Only add points for key durations to avoid clutter
        // 1s, 5s, 15s, 30s, 1m, 5m, 10m, 20m, 1h
        const keyDurations = [1, 5, 15, 30, 60, 300, 600, 1200, 3600, 7200];
        
        // Find closest data point to key duration or if it's a "peak"
        if (keyDurations.includes(d.duration) || i % 10 === 0) {
            const label = Formatters.formatDuration(d.duration);
            const wkg = (d.watts / weight).toFixed(2);
            
            // Fix: Pass d.date (assuming date exists in json) or fallback
            const dateStr = d.date ? d.date.split('T')[0] : 'Unknown';

            pointsHtml += `<circle cx="${x}" cy="${y}" r="3" fill="#0f172a" stroke="#3b82f6" stroke-width="2"
                class="cursor-pointer hover:scale-150 transition-all"
                onclick="window.handlePowerCurveClick(event, '${label}', ${d.watts}, '${wkg}', '${dateStr}')" />`;
        }
    });

    return `
        <div class="relative w-full h-[300px] select-none">
            <svg viewBox="0 0 ${width} ${height}" class="w-full h-full overflow-visible">
                <line x1="${pad.l}" y1="${height - pad.b}" x2="${width - pad.r}" y2="${height - pad.b}" stroke="#334155" stroke-width="1"/>
                <line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${height - pad.b}" stroke="#334155" stroke-width="1"/>

                <path d="${pathD}" fill="none" stroke="#3b82f6" stroke-width="2" />
                
                ${pointsHtml}
                
                <text x="${width-10}" y="${height-10}" text-anchor="end" fill="#64748b" font-size="10">Duration (Log Scale)</text>
            </svg>
        </div>
    `;
};
