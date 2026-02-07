export const FuelComponents = {
    formatTime(s) {
        const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
        const pad = (n) => String(n).padStart(2,'0');
        if(h>0) return `${h}:${pad(m)}:${pad(sec)}`;
        return `${pad(m)}:${pad(sec)}`;
    },

    renderFuelButtons(menu) {
        const activeItems = menu.filter(i => i.active);
        if (activeItems.length === 0) return '<div class="text-[10px] text-slate-600 italic text-center py-4">No items selected in Mission Control</div>';
        
        return activeItems.map(item => `
            <div class="flex gap-1 w-full h-10">
                <button class="btn-quick-fuel w-[25%] bg-slate-800 border border-slate-700 active:bg-slate-600 text-slate-400 rounded-lg font-bold text-[9px] uppercase"
                    data-carbs="${Math.round(item.carbs / 2)}" data-name="1/2 ${item.label}">
                    ${Math.round(item.carbs / 2)}g
                </button>
                <button class="btn-quick-fuel flex-1 bg-slate-700/50 border border-slate-700 active:bg-orange-600 active:text-white text-slate-200 rounded-lg font-bold text-[10px] uppercase flex items-center justify-between px-3"
                    data-carbs="${item.carbs}" data-name="${item.label}">
                    <span>${item.label}</span>
                    <span class="opacity-50">${item.carbs}g</span>
                </button>
            </div>
        `).join('');
    },

    renderHistoryLog(log) {
        if (!log || log.length === 0) return '<div class="italic opacity-50 text-center py-2">System Live... Log data to begin.</div>';
        return log.slice().reverse().map((entry, index) => {
            const realIndex = log.length - 1 - index;
            const color = entry.type === 'drink' ? 'text-blue-400' : (entry.type === 'water' ? 'text-cyan-400' : 'text-orange-400');
            return `
            <div class="btn-delete-log flex justify-between items-center py-1 border-b border-slate-800 last:border-0 cursor-pointer" data-index="${realIndex}">
                <div class="flex items-center gap-2">
                    <span class="text-red-900"><i class="fa-solid fa-xmark text-[8px]"></i></span>
                    <span class="font-mono text-slate-500">${entry.time}</span>
                    <span class="text-slate-300 truncate max-w-[80px]">${entry.item}</span>
                </div>
                <span class="font-bold ${color}">${entry.carbs > 0 ? entry.carbs+'g' : ''}${entry.fluid > 0 ? entry.fluid+'ml' : ''}</span>
            </div>`;
        }).join('');
    },

    renderFuelEditor(menu) {
        return menu.map((item, index) => `
            <div class="flex gap-2 items-center bg-slate-800 p-2 rounded border border-slate-700">
                <button class="btn-toggle-active w-8 h-8 flex items-center justify-center rounded ${item.active ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-900'}" data-index="${index}">
                    <i class="fa-solid ${item.active ? 'fa-check-square' : 'fa-square'}"></i>
                </button>
                <div class="flex-1 text-[10px] text-white">${item.label}</div>
                <div class="text-[10px] text-slate-400">${item.carbs}g</div>
            </div>
        `).join('');
    }
};
