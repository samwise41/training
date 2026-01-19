export const buildFTPChart = (planMd) => {
    const md = planMd || "";
    if (!md) return '<div class="p-4 text-slate-500 italic">Plan data not loaded</div>';
    
    const lines = md.split('\n'); 
    const dataPoints = []; 
    let startFound = false;
    
    for (let line of lines) {
        if (line.includes('### Historical FTP Log')) { startFound = true; continue; }
        if (startFound) {
            if (line.trim().startsWith('#') && dataPoints.length > 0) break; 
            if (line.includes('|') && !line.includes('---') && !line.toLowerCase().includes('date')) {
                const parts = line.split('|');
                if (parts.length > 2) {
                    const dateStr = parts[1].trim(); 
                    const ftpStr = parts[2].trim(); 
                    const date = new Date(dateStr); 
                    const ftp = parseInt(ftpStr.replace(/\D/g, ''));
                    if (!isNaN(date.getTime()) && !isNaN(ftp)) dataPoints.push({ date, ftp, label: dateStr });
                }
            }
        }
    }
    
    dataPoints.sort((a, b) => a.date - b.date); 
    if (dataPoints.length < 2) return ''; 
    
    const width = 800, height = 250, padding = { top: 30, bottom: 40, left: 50, right: 30 };
    const minFTP = Math.min(...dataPoints.map(d => d.ftp)) * 0.95, maxFTP = Math.max(...dataPoints.map(d => d.ftp)) * 1.05;
    const minTime = dataPoints[0].date.getTime(), maxTime = dataPoints[dataPoints.length - 1].date.getTime();
    const getX = (d) => padding.left + ((d.date.getTime() - minTime) / (maxTime - minTime)) * (width - padding.left - padding.right);
    const getY = (d) => height - padding.bottom - ((d.ftp - minFTP) / (maxFTP - minFTP)) * (height - padding.top - padding.bottom);
    
    let pathD = `M ${getX(dataPoints[0])} ${getY(dataPoints[0])}`; 
    let pointsHTML = '';
    
    dataPoints.forEach(d => {
        const x = getX(d); const y = getY(d); 
        pathD += ` L ${x} ${y}`;
        pointsHTML += `<circle cx="${x}" cy="${y}" r="4" fill="#1e293b" stroke="#3b82f6" stroke-width="2"><title>${d.label}: ${d.ftp}W</title></circle><text x="${x}" y="${y - 10}" text-anchor="middle" font-size="10" fill="#94a3b8" font-weight="bold">${d.ftp}</text><text x="${x}" y="${height - 15}" text-anchor="middle" font-size="10" fill="#64748b">${d.date.getMonth()+1}/${d.date.getFullYear() % 100}</text>`;
    });
    
    return `<div class="bg-slate-800/30 border border-slate-700 rounded-xl p-6 mb-0"><h2 class="text-lg font-bold text-white mb-6 border-b border-slate-700 pb-2 flex items-center gap-2"><i class="fa-solid fa-arrow-trend-up text-emerald-500"></i> FTP Progression</h2><div class="w-full"><svg viewBox="0 0 ${width} ${height}" class="w-full h-auto"><line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#334155" stroke-width="1" /><line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#334155" stroke-width="1" /><path d="${pathD}" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />${pointsHTML}</svg></div></div>`;
};
