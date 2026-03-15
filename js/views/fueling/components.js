export const FuelComponents = {
    formatTime(s) {
        const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
        const pad = (n) => String(n).padStart(2,'0');
        if(h>0) return `${h}:${pad(m)}:${pad(sec)}`;
        return `${pad(m)}:${pad(sec)}`;
    },

    renderFuelButtons(menu) {
        const activeItems = menu.filter(i => (i.quantity || 0) > 0);
        if (activeItems.length === 0) return '<div class="text-[10px] text-slate-600 italic text-center py-4">No items packed in Mission Control</div>';
        
        return activeItems.map(item => `
            <div class="flex gap-1 w-full h-10 mb-2 last:mb-0">
                <button class="btn-quick-fuel w-[25%] bg-slate-800 border border-slate-700 active:bg-slate-600 text-slate-400 rounded-lg font-bold text-[9px] uppercase transition-colors"
                    data-carbs="${Math.round(item.carbs / 2)}" data-name="1/2 ${item.label}">
                    ${Math.round(item.carbs / 2)}g
                </button>
                <button class="btn-quick-fuel flex-1 bg-slate-700/50 border border-slate-700 active:bg-orange-600 active:text-white text-slate-200 rounded-lg font-bold text-[10px] uppercase flex items-center justify-between px-3 transition-colors"
                    data-carbs="${item.carbs}" data-name="${item.label}">
                    <div class="flex flex-col items-start">
                        <span>${item.label}</span>
                        <span class="text-[8px] text-slate-400 font-bold tracking-widest leading-none mt-0.5">QTY: ${item.quantity}</span>
                    </div>
                    <span class="font-mono text-white opacity-80">${item.carbs}g</span>
                </button>
            </div>
        `).join('');
    },

    renderHistoryLog(log) {
        if (!log || log.length === 0) return '<div class="italic opacity-50 text-center py-2">System Live... Log data to begin.</div>';
        return log.slice().reverse().map((entry, index) => {
            const realIndex = log.length - 1 - index;
            // UPDATE: Changed drink to purple-400
            const color = entry.type === 'drink' ? 'text-purple-400' : (entry.type === 'water' ? 'text-cyan-400' : 'text-orange-400');
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
            <div class="flex gap-2 items-center bg-slate-800 p-2 rounded border border-slate-700 mb-2 last:mb-0">
                <div class="flex-1 text-[10px] text-white font-bold truncate">${item.label}</div>
                <div class="text-[10px] text-slate-400 font-mono w-8 text-right pr-2">${item.carbs}g</div>
                <div class="flex items-center gap-1 bg-slate-900 rounded border border-slate-700 p-0.5">
                    <button class="btn-qty-adj text-slate-400 hover:text-white px-2 py-1 transition-colors" data-index="${index}" data-dir="-1"><i class="fa-solid fa-minus text-[10px]"></i></button>
                    <span class="text-xs font-mono w-4 text-center text-white select-none">${item.quantity || 0}</span>
                    <button class="btn-qty-adj text-slate-400 hover:text-white px-2 py-1 transition-colors" data-index="${index}" data-dir="1"><i class="fa-solid fa-plus text-[10px]"></i></button>
                </div>
            </div>
        `).join('');
    }
};
