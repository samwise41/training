export const FuelView = {
    getHtml(state) {
        // Calculate formatted plan string for display (e.g. "3h 00m")
        const planH = Math.floor(state.plannedDuration / 60);
        const planM = state.plannedDuration % 60;
        const planStr = `${planH}h${planM > 0 ? ' ' + planM + 'm' : ''}`;

        return `
            <div class="p-4 max-w-5xl mx-auto pb-48 relative">
                
                <button id="btn-fuel-help" class="absolute top-2 right-2 text-slate-600 hover:text-white transition-colors z-20">
                    <i class="fa-solid fa-circle-question text-xl"></i>
                </button>

                <div class="grid grid-cols-2 gap-4 mb-4 mt-6">
                    <div class="bg-slate-900 p-3 rounded-xl border border-slate-700 flex flex-col items-center shadow-lg relative overflow-hidden">
                        <div class="text-[10px] text-blue-400 uppercase font-bold mb-2 z-10">Mix (Logged)</div>
                        <div class="relative w-12 h-24 border-2 border-slate-600 rounded-b-xl rounded-t-md bg-slate-800/50 overflow-hidden z-10">
                            <div id="mix-bottle-liquid" class="absolute bottom-0 left-0 w-full bg-blue-600 transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.6)]" style="height: 100%;"></div>
                            <div class="absolute top-1/4 w-full h-[1px] bg-white/10"></div>
                            <div class="absolute top-2/4 w-full h-[1px] bg-white/10"></div>
                            <div class="absolute top-3/4 w-full h-[1px] bg-white/10"></div>
                        </div>
                        <div class="text-[10px] text-slate-400 mt-2 z-10">Bottle #<span id="mix-bottle-count" class="text-white font-bold text-lg">1</span></div>
                        <div id="pulse-indicator" class="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-slate-800 z-10"></div>
                    </div>

                    <div class="bg-slate-900 p-3 rounded-xl border border-slate-700 flex flex-col items-center shadow-lg">
                        <div class="text-[10px] text-cyan-400 uppercase font-bold mb-2">Water (Logged)</div>
                        <div class="relative w-12 h-24 border-2 border-slate-600 rounded-b-xl rounded-t-md bg-slate-800/50 overflow-hidden">
                            <div id="water-bottle-liquid" class="absolute bottom-0 left-0 w-full bg-cyan-600 transition-all duration-1000 shadow-[0_0_15px_rgba(8,145,178,0.6)]" style="height: 100%;"></div>
                            <div class="absolute top-1/4 w-full h-[1px] bg-white/10"></div>
                            <div class="absolute top-2/4 w-full h-[1px] bg-white/10"></div>
                            <div class="absolute top-3/4 w-full h-[1px] bg-white/10"></div>
                        </div>
                        <div class="text-[10px] text-slate-400 mt-2">Bottle #<span id="water-bottle-count" class="text-white font-bold text-lg">1</span></div>
                    </div>
                </div>

                <div class="bg-slate-900 p-4 rounded-xl border border-slate-700 mb-6 flex flex-col gap-5 shadow-lg">
                    
                    <div>
                        <div class="flex justify-between items-end mb-1">
                            <div class="text-[10px] text-emerald-400 uppercase font-bold">Carbs (g) <span class="text-slate-600 font-normal ml-1">Plan: ${planStr}</span></div>
                            <div class="text-xs text-slate-300 font-mono"><span id="carb-val">0</span> / <span id="carb-pacer">0</span></div>
                        </div>
                        <div class="w-full h-4 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
                            <div id="carb-progress-bar" class="h-full bg-emerald-600 transition-all duration-500" style="width: 0%"></div>
                            <div id="carb-pacer-marker" class="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_5px_rgba(255,255,255,0.9)] z-10" style="left: 0%"></div>
                        </div>
                    </div>

                    <div>
                        <div class="flex justify-between items-end mb-1">
                            <div class="text-[10px] text-cyan-400 uppercase font-bold">Fluid (ml)</div>
                            <div class="text-xs text-slate-300 font-mono"><span id="fluid-val">0</span> / <span id="fluid-pacer">0</span></div>
                        </div>
                        <div class="w-full h-4 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
                            <div id="fluid-progress-bar" class="h-full bg-cyan-600 transition-all duration-500" style="width: 0%"></div>
                            <div id="fluid-pacer-marker" class="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_5px_rgba(255,255,255,0.9)] z-10" style="left: 0%"></div>
                        </div>
                    </div>
                </div>

                <div id="fuel-active-view" class="hidden">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        
                        <div id="card-drink" class="bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg">
                            <div class="text-blue-400 text-xs uppercase font-bold tracking-widest mb-1">Hydration</div>
                            <div id="timer-drink" class="text-7xl font-mono font-bold text-white mb-4 tracking-tighter">15:00</div>
                            <div class="flex gap-2 w-full">
                                <button id="btn-log-sip-mix" class="flex-1 bg-blue-600 active:bg-blue-500 md:hover:bg-blue-500 text-white py-4 rounded-lg font-bold text-sm uppercase transition-colors border-b-4 border-blue-800 active:border-b-0 active:translate-y-1">
                                    <div class="text-xs opacity-70">Mix</div>
                                    <i class="fa-solid fa-bolt"></i> Sip
                                </button>
                                <button id="btn-log-sip-water" class="flex-1 bg-slate-700 active:bg-cyan-600 md:hover:bg-cyan-600 text-cyan-200 active:text-white py-4 rounded-lg font-bold text-sm uppercase transition-colors border-b-4 border-slate-900 active:border-b-0 active:translate-y-1">
                                    <div class="text-xs opacity-70">Water</div>
                                    <i class="fa-solid fa-glass-water"></i> Sip
                                </button>
                            </div>
                        </div>

                        <div id="card-eat" class="bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg">
                            <div class="text-orange-400 text-xs uppercase font-bold tracking-widest mb-1">Fueling</div>
                            <div id="timer-eat" class="text-7xl font-mono font-bold text-white mb-4 tracking-tighter">45:00</div>
                            <div class="w-full max-h-[300px] overflow-y-auto custom-scrollbar pr-1 mb-2">
                                <div id="fuel-menu-container" class="space-y-2">
                                    ${this.renderFuelButtons(state.fuelMenu)}
                                </div>
                            </div>
                            <button id="btn-show-custom-fuel" class="text-[10px] text-slate-500 underline w-full text-center mt-2 py-2">Log Custom Amount</button>
                            <div id="custom-fuel-input-area" class="w-full mt-2 pt-2 border-t border-slate-700/50 hidden flex gap-2">
                                <input type="number" id="input-custom-carbs" placeholder="g" class="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-center">
                                <button id="btn-log-custom" class="flex-1 bg-slate-700 text-white rounded px-2 py-1 text-xs font-bold">ADD</button>
                            </div>
                        </div>
                    </div>

                    <div class="bg-slate-900 rounded-xl border border-slate-800 p-4 mb-6 shadow-lg">
                        <div class="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                            <span class="text-[10px] text-slate-500 uppercase font-bold">Session Intake Log</span>
                            <span class="text-[9px] text-slate-600 italic">Tap item to remove</span>
                        </div>
                        <div id="fuel-history-log" class="space-y-1 max-h-[150px] overflow-y-auto custom-scrollbar text-sm text-slate-400">
                            <div class="italic opacity-50 text-xs text-center py-2">No intake recorded yet.</div>
                        </div>
                    </div>
                </div>

                <div id="fuel-config-view" class="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6 shadow-lg">
                    <h3 class="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2">Mission Control</h3>
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        
                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                            <label class="block text-[10px] text-purple-400 uppercase font-bold mb-1">Ride Time (min)</label>
                            <input type="number" id="input-planned-duration" value="${state.plannedDuration}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white">
                        </div>

                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                            <label class="block text-[10px] text-blue-400 uppercase font-bold mb-1">Mix Strength (g/btl)</label>
                            <input type="number" id="input-bottle-carbs" value="${state.carbsPerBottle}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white">
                        </div>

                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                            <label class="block text-[10px] text-emerald-400 uppercase font-bold mb-1">Target Carbs/Hr</label>
                            <input type="number" id="input-target-hourly" value="${state.targetHourlyCarbs}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white">
                        </div>
                        
                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                            <label class="block text-[10px] text-cyan-400 uppercase font-bold mb-1">Target Fluid/Hr</label>
                            <input type="number" id="input-target-fluid" value="${state.targetHourlyFluid}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white">
                        </div>

                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                            <label class="block text-[10px] text-blue-400 uppercase font-bold mb-1">Bottle Vol (ml)</label>
                            <input type="number" id="input-bottle-vol" value="${state.bottleVolume}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white">
                        </div>

                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                             <label class="block text-[10px] text-slate-400 uppercase font-bold mb-1">Drink Timer (min)</label>
                             <input type="number" id="input-drink-int" value="${state.drinkInterval}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white">
                        </div>

                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                             <label class="block text-[10px] text-slate-400 uppercase font-bold mb-1">Eat Timer (min)</label>
                             <input type="number" id="input-eat-int" value="${state.eatInterval}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white">
                        </div>
                    </div>
                    
                    <div class="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-[10px] text-slate-500 uppercase font-bold">Active Menu Items</span>
                            <button id="btn-toggle-all-fuel" class="text-[10px] text-blue-400 hover:text-blue-300 underline font-bold px-2 py-1">Select / Unselect All</button>
                        </div>
                        <div id="fuel-library-editor" class="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar mb-3">${this.renderFuelEditor(state.fuelMenu)}</div>
                        
                        <div class="pt-3 border-t border-slate-700/50 flex gap-2">
                            <input type="text" id="new-item-name" placeholder="Name (e.g. Pizza)" class="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white">
                            <input type="number" id="new-item-carbs" placeholder="g" class="w-16 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white text-center">
                            <button id="btn-add-item" class="bg-emerald-600 active:bg-emerald-500 text-white rounded px-3 py-1 text-xs font-bold uppercase"><i class="fa-solid fa-plus"></i></button>
                        </div>
                    </div>
                </div>

                <div class="mt-6 grid grid-cols-1 gap-3">
                    <button id="btn-fuel-toggle" class="w-full py-4 rounded-xl font-bold text-xl uppercase tracking-widest bg-emerald-600 active:bg-emerald-500 md:hover:bg-emerald-500 text-white shadow-lg transition-colors">Start Engine</button>
                    <button id="btn-fuel-reset" class="hidden w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest bg-slate-700 active:bg-slate-600 text-slate-300 transition-colors">Reset / Configure</button>
                </div>

                <div id="fuel-help-modal" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div class="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
                        <div class="sticky top-0 bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center">
                            <h3 class="font-bold text-white uppercase tracking-widest">Flight Manual</h3>
                            <button id="btn-close-help" class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark text-xl"></i></button>
                        </div>
                        <div class="p-4 space-y-6 text-sm text-slate-300">
                            <div><h4 class="text-emerald-400 font-bold uppercase text-xs mb-2">1. Visual Inventory (Bottles)</h4><p class="mb-2 text-xs">Shows exactly what you have logged.</p><ul class="list-disc pl-4 space-y-1 text-xs text-slate-400"><li><span class="text-blue-400 font-bold">Mix Bottle:</span> Carbs + Fluid.</li><li><span class="text-cyan-400 font-bold">Water Bottle:</span> Fluid only.</li></ul></div>
                            <div><h4 class="text-emerald-400 font-bold uppercase text-xs mb-2">2. Pacing (Progress Bars)</h4><p class="mb-2 text-xs">Are you on track for the whole ride?</p><ul class="list-disc pl-4 space-y-1 text-xs text-slate-400"><li><span class="font-bold text-white">White Line:</span> Where you *should* be right now.</li><li><span class="font-bold text-white">Colored Bar:</span> Actual intake. Keep the bar ahead of the line!</li></ul></div>
                            <div class="bg-slate-800 p-3 rounded text-[10px] text-slate-400 italic"><strong>Safety:</strong> Progress saves automatically.</div>
                        </div>
                        <div class="p-4 border-t border-slate-800">
                            <button id="btn-dismiss-help" class="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-bold text-xs uppercase">Got it</button>
                        </div>
                    </div>
                </div>

            </div>
        `;
    },

    renderFuelButtons(menu) {
        const activeItems = menu.filter(i => i.active);
        if (activeItems.length === 0) return '<div class="text-xs text-slate-500 italic text-center p-4 border border-slate-700/50 rounded-lg">No items active.<br>Enable them in settings below.</div>';
        return activeItems.map(item => `
            <div class="flex gap-2 w-full h-14">
                <button class="btn-quick-fuel w-[30%] bg-slate-800 border border-slate-600 active:bg-slate-600 active:border-slate-500 md:hover:border-slate-400 text-slate-400 rounded-lg font-bold text-xs uppercase flex flex-col items-center justify-center transition-all" data-carbs="${Math.round(item.carbs / 2)}" data-name="1/2 ${item.label}"><span class="text-[9px] opacity-60">1/2</span><span>${Math.round(item.carbs / 2)}</span></button>
                <button class="btn-quick-fuel flex-1 bg-slate-700 border border-slate-600 active:bg-orange-600 active:text-white md:hover:bg-slate-600 text-slate-200 rounded-lg font-bold text-sm uppercase flex flex-col items-center justify-center transition-all" data-carbs="${item.carbs}" data-name="${item.label}"><div class="flex items-center gap-2"><i class="fa-solid ${item.icon} opacity-70"></i><span>${item.label}</span></div><span class="text-xs opacity-60 font-normal">${item.carbs}g</span></button>
            </div>
        `).join('');
    },

    renderHistoryLog(log) {
        if (!log || log.length === 0) return '<div class="italic opacity-50 text-xs text-center py-2">Session started. Ready to log.</div>';
        return log.slice().reverse().map((entry, index) => {
            const realIndex = log.length - 1 - index;
            let color = 'text-emerald-400';
            if (entry.type === 'drink') color = 'text-blue-400';
            if (entry.type === 'water') color = 'text-cyan-400';
            let valDisplay = '';
            if (entry.carbs > 0) valDisplay = `+${entry.carbs}g`;
            if (entry.fluid > 0) valDisplay += ` / ${entry.fluid}ml`;
            if (valDisplay === '') valDisplay = '-';
            return `<div class="btn-delete-log flex justify-between items-center py-2 border-b border-slate-800/50 last:border-0 cursor-pointer active:bg-red-900/20 transition-colors" data-index="${realIndex}"><div class="flex items-center gap-3 overflow-hidden"><span class="text-red-500/50 hover:text-red-500"><i class="fa-solid fa-trash-can text-[10px]"></i></span><span class="font-mono text-slate-500 text-xs">${entry.time}</span><span class="text-slate-300 truncate">${entry.item}</span></div><span class="font-bold ${color} whitespace-nowrap pl-2 text-xs">${valDisplay}</span></div>`;
        }).join('');
    },

    renderFuelEditor(menu) {
        return menu.map((item, index) => `
            <div class="flex gap-2 items-center bg-slate-800 p-2 rounded border border-slate-700"><button class="btn-toggle-active w-10 h-10 flex items-center justify-center rounded transition-colors ${item.active ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-900 border border-slate-700'}" data-index="${index}"><i class="fa-solid ${item.active ? 'fa-check-square' : 'fa-square'} text-lg"></i></button><div class="w-6 text-center text-slate-500"><i class="fa-solid ${item.icon}"></i></div><div class="flex-1 text-sm text-white">${item.label}</div><div class="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-700">${item.carbs}g</div></div>
        `).join('');
    },

    formatTime(s) {
        const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
        const pad = (n) => String(n).padStart(2,'0');
        if(h>0) return `${h}:${pad(m)}:${pad(sec)}`;
        return `${pad(m)}:${pad(sec)}`;
    }
};
