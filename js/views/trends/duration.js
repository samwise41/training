let currentLogData = [];

// --- DURATION TOOL LOGIC ---
export const updateDurationAnalysis = () => {
    const sportSelect = document.getElementById('kpi-sport-select');
    const daySelect = document.getElementById('kpi-day-select');
    const timeSelect = document.getElementById('kpi-time-select');
    
    if (!sportSelect || !daySelect || !timeSelect) return;
    
    // Use local logData reference
    const dataToUse = (Array.isArray(currentLogData) && currentLogData.length > 0) ? currentLogData : [];
    const selectedSport = sportSelect.value;
    const selectedDay = daySelect.value;
    const selectedTime = timeSelect.value;
    
    let cutoffDate = null;
    if (selectedTime !== 'All') { 
        const days = parseInt(selectedTime); 
        cutoffDate = new Date(); 
        cutoffDate.setDate(cutoffDate.getDate() - days); 
        cutoffDate.setHours(0, 0, 0, 0); 
    }
    
    let totalPlanned = 0, totalActual = 0, debugRows = '';
    const dayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    dataToUse.forEach(item => {
        if (!item || !item.date) return;
        if (cutoffDate && item.date < cutoffDate) return;
        
        const itemDayName = dayMap[item.date.getDay()];
        if (selectedSport !== 'All' && item.type !== selectedSport) return;
        if (selectedDay !== 'All') {
            if (selectedDay === 'Weekday' && (item.date.getDay() === 0 || item.date.getDay() === 6)) return;
            if (selectedDay !== 'Weekday' && itemDayName !== selectedDay) return;
        }
        
        totalPlanned += (item.plannedDuration || 0); 
        let thisActual = 0, actualClass = "text-slate-300";
        
        if (item.type === item.actualType) { 
            thisActual = (item.actualDuration || 0); 
            totalActual += thisActual; 
        } else if (item.plannedDuration > 0) { 
            actualClass = "text-red-400 font-bold"; 
        }
        
        debugRows += `<tr class="border-b border-slate-700 hover:bg-slate-800/50"><td class="py-2 px-2 text-xs font-mono text-slate-400">${item.date.toISOString().split('T')[0]}</td><td class="py-2 px-2 text-xs text-slate-300">${itemDayName}</td><td class="py-2 px-2 text-xs text-slate-300">${item.type}</td><td class="py-2 px-2 text-xs text-slate-300 text-center">${item.plannedDuration}m</td><td class="py-2 px-2 text-xs ${actualClass} text-center">${thisActual}m</td></tr>`;
    });

    const debugTableBody = document.querySelector('#kpi-debug-table tbody');
    if (debugTableBody) debugTableBody.innerHTML = debugRows || '<tr><td colspan="5" class="text-center py-4 text-slate-500 italic">No matching records found</td></tr>';
    
    const diff = totalActual - totalPlanned;
    const pct = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;
    
    const formatTime = (minutes) => { 
        const m = Math.abs(minutes); 
        if (m === 0) return "0m"; 
        const h = Math.floor(m / 60);
        const rem = m % 60; 
        return h > 0 ? `${h}h ${rem}m` : `${rem}m`; 
    };

    if (document.getElementById('kpi-analysis-planned')) {
        document.getElementById('kpi-analysis-planned').innerText = formatTime(totalPlanned);
        document.getElementById('kpi-analysis-actual').innerText = formatTime(totalActual);
        
        const diffEl = document.getElementById('kpi-analysis-diff');
        const sign = diff > 0 ? '+' : (diff < 0 ? '-' : '');
        diffEl.innerText = sign + formatTime(diff);
        diffEl.className = `text-xl font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`;
        
        const pctEl = document.getElementById('kpi-analysis-pct');
        pctEl.innerText = `${pct}%`;
        pctEl.className = `text-xl font-bold ${pct >= 80 ? 'text-emerald-400' : (pct >= 50 ? 'text-yellow-400' : 'text-red-400')}`;
    }
};

export const renderDurationTool = (logData) => {
    // Cache data for the tool logic
    currentLogData = logData; 
    
    return `<div class="kpi-card bg-slate-800/20 border-t-4 border-t-purple-500"><div class="kpi-header border-b border-slate-700 pb-2 mb-4"><i class="fa-solid fa-filter text-purple-500 text-xl"></i><span class="kpi-title ml-2 text-purple-400">Duration Analysis Tool</span></div><div class="flex flex-col sm:flex-row gap-4 mb-8"><div class="flex-1"><label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Sport Filter</label><select id="kpi-sport-select" onchange="window.App.updateDurationAnalysis()" class="gear-select"><option value="All">All Sports</option><option value="Bike">Bike</option><option value="Run">Run</option><option value="Swim">Swim</option></select></div><div class="flex-1"><label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Day Filter</label><select id="kpi-day-select" onchange="window.App.updateDurationAnalysis()" class="gear-select"><option value="All">All Days</option><option value="Weekday">Weekday (Mon-Fri)</option><option value="Monday">Monday</option><option value="Tuesday">Tuesday</option><option value="Wednesday">Wednesday</option><option value="Thursday">Thursday</option><option value="Friday">Friday</option><option value="Saturday">Saturday</option><option value="Sunday">Sunday</option></select></div><div class="flex-1"><label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Time Period</label><select id="kpi-time-select" onchange="window.App.updateDurationAnalysis()" class="gear-select"><option value="All">All Time</option><option value="30">Last 30 Days</option><option value="60">Last 60 Days</option><option value="90">Last 90 Days</option></select></div></div><div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"><div class="bg-slate-800/50 p-4 rounded-lg text-center border border-slate-700 shadow-sm"><div class="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Planned</div><div id="kpi-analysis-planned" class="text-xl font-bold text-white">--</div></div><div class="bg-slate-800/50 p-4 rounded-lg text-center border border-slate-700 shadow-sm"><div class="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Actual</div><div id="kpi-analysis-actual" class="text-xl font-bold text-white">--</div></div><div class="bg-slate-800/50 p-4 rounded-lg text-center border border-slate-700 shadow-sm"><div class="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Difference</div><div id="kpi-analysis-diff" class="text-xl font-bold text-white">--</div></div><div class="bg-slate-800/50 p-4 rounded-lg text-center border border-slate-700 shadow-sm"><div class="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Adherence</div><div id="kpi-analysis-pct" class="text-xl font-bold text-white">--</div></div></div><div class="border-t border-slate-700 pt-4"><h4 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Detailed Log (Matches Filters)</h4><div class="overflow-x-auto max-h-60 overflow-y-auto border border-slate-700 rounded-lg"><table id="kpi-debug-table" class="w-full text-left text-sm text-slate-300"><thead class="bg-slate-900 sticky top-0"><tr><th class="py-2 px-2 text-xs font-bold uppercase text-slate-500">Date</th><th class="py-2 px-2 text-xs font-bold uppercase text-slate-500">Day</th><th class="py-2 px-2 text-xs font-bold uppercase text-slate-500">Type</th><th class="py-2 px-2 text-xs font-bold uppercase text-slate-500 text-center">Plan</th><th class="py-2 px-2 text-xs font-bold uppercase text-slate-500 text-center">Act</th></tr></thead><tbody class="divide-y divide-slate-700"></tbody></table></div></div></div><div class="mt-8 text-center text-xs text-slate-500 italic">* 'h' in duration column denotes hours, otherwise minutes assumed.</div>`;
}
