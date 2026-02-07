export const FuelComponents = {
    
    formatTime(s) {
        const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
        const pad = (n) => String(n).padStart(2,'0');
        if(h>0) return `${h}:${pad(m)}:${pad(sec)}`;
        return `${pad(m)}:${pad(sec)}`;
    },

    renderFuelButtons(menu) {
        const activeItems = menu.filter(i => i.active);
        if (activeItems.length === 0) return '<div class="text-xs text-slate-500 italic text-center p-2">No solid food active.</div>';
        
        return activeItems.map(item => `
            <div class="flex gap-2 w-full h-12">
                <button class="btn-quick-fuel w-[30%] bg-slate-800 border border-slate-600 active:bg-slate-600 text-slate-400 rounded-lg font-bold text-xs uppercase flex flex-col items-center justify-center transition-all"
                    data-carbs="${Math.round(item.carbs / 2)}" data-name="1/2 ${item.label}">
                    <span class="text-[9px] opacity-60">1/2</span>
                    <span>${Math.round(item.carbs / 2)}</span>
                </button>
                <button class="btn-quick-fuel flex-1 bg-slate-700 border border-slate-600 active:bg-orange-600 active:text-white md:hover:bg-slate-600 text-slate-200 rounded-lg font-bold text-xs uppercase flex items-center justify-between px-4 transition-all"
                    data-carbs="${item.carbs}" data-name="${item.label}">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid ${item.icon} opacity-70"></i>
                        <span>${item.label}</span>
                    </div>
                    <span class="text-xs opacity-60 font-normal">${item.carbs}g</span>
                </button>
            </div>
        `).join('');
    },

    renderHistoryLog(log) {
        if (!log || log.length === 0) return '<div class="italic opacity-50 text-xs text-center py-2">Ready to log.</div>';
        
        return log.slice().reverse().map((entry, index) => {
            const realIndex = log.length - 1 - index;
            let color = 'text-emerald-400';
            if (entry.type === 'drink') color = 'text-blue-400';
            if (entry.type === 'water') color = 'text-cyan-400';
            if (entry.type === 'flask') color = 'text-orange-400';
            
            let valDisplay = '';
            if (entry.carbs > 0) valDisplay = `+${entry.carbs}g`;
            if (entry.fluid > 0) valDisplay += ` / ${entry.fluid}ml`;
            if (valDisplay === '') valDisplay = '-';

            return `
            <div class="btn-delete-log flex justify-between items-center py-2 border-b border-slate-800/50 last:border-0 cursor-pointer active:bg-red-900/20 transition-colors" data-index="${realIndex}">
                <div class="flex items-center gap-3 overflow-hidden">
                    <span class="text-red-500/50 hover:text-red-500"><i class="fa-solid fa-trash-can text-[10px]"></i></span>
                    <span class="font-mono text-slate-500 text-xs">${entry.time}</span>
                    <span class="text-slate-300 truncate">${entry.item}</span>
                </div>
                <span class="font-bold ${color} whitespace-nowrap pl-2 text-xs">${valDisplay}</span>
            </div>
            `;
        }).join('');
    },

    renderFuelEditor(menu) {
        return menu.map((item, index) => `
            <div class="flex gap-2 items-center bg-slate-800 p-2 rounded border border-slate-700">
                <button class="btn-toggle-active w-10 h-10 flex items-center justify-center rounded transition-colors ${item.active ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-900 border border-slate-700'}" data-index="${index}">
                    <i class="fa-solid ${item.active ? 'fa-check-square' : 'fa-square'} text-lg"></i>
                </button>
                <div class="w-6 text-center text-slate-500"><i class="fa-solid ${item.icon}"></i></div>
                <div class="flex-1 text-sm text-white">${item.label}</div>
                <div class="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-700">${item.carbs}g</div>
            </div>
        `).join('');
    }
};
