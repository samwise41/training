export const FuelView = {
    getHtml(state) {
        return `
            <div class="p-4 max-w-5xl mx-auto pb-32">
                
                <div class="grid grid-cols-12 gap-4 mb-6">
                    <div class="col-span-12 md:col-span-4 bg-slate-900 p-5 rounded-xl border border-slate-700 flex flex-col justify-center relative overflow-hidden">
                        <div class="text-xs text-slate-500 uppercase tracking-widest mb-1">Duration</div>
                        <div id="fuel-total-time" class="text-5xl font-mono font-bold text-white tracking-tighter z-10">00:00:00</div>
                        <div id="pulse-indicator" class="absolute top-2 right-2 h-3 w-3 rounded-full bg-slate-800"></div>
                    </div>

                    <div class="col-span-6 md:col-span-4 bg-slate-900 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
                        <div class="relative w-12 h-20 mx-auto">
                            <div class="w-full h-full border-4 border-slate-600 rounded-b-xl rounded-t-md bg-slate-800/50 overflow-hidden relative">
                                <div id="virtual-bottle-liquid" class="absolute bottom-0 left-0 w-full bg-blue-500/80 transition-all duration-1000" style="height: 100%;"></div>
                            </div>
                        </div>
                        <div class="flex-1">
                            <div class="text-[10px] text-slate-500 uppercase tracking-widest">Pacer</div>
                            <div class="text-2xl font-bold text-blue-400"><span id="bottle-percent-display">100</span>%</div>
                            <div class="text-[10px] text-slate-600">Bottle #<span id="target-bottle-count">1</span></div>
                        </div>
                    </div>

                    <div class="col-span-6 md:col-span-4 bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col justify-center relative overflow-hidden">
                        <div class="relative z-10">
                            <div class="text-xs text-slate-500 uppercase tracking-widest mb-1">Total Carbs</div>
                            <div class="flex items-baseline gap-2">
                                <span id="fuel-consumed-display" class="text-4xl font-bold text-emerald-400">0</span>
                                <span class="text-sm text-slate-400">g</span>
                            </div>
                            <div id="fuel-target-display" class="text-xs text-slate-500 mt-1">Target: 0g</div>
                        </div>
                        <div id="fuel-gauge-fill" class="absolute bottom-0 left-0 w-full h-1 bg-emerald-500/20 transition-all duration-1000"></div>
                    </div>
                </div>

                <div id="fuel-active-view" class="hidden">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        
                        <div id="card-drink" class="bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center">
                            <div class="text-blue-400 text-xs uppercase font-bold tracking-widest mb-1">Hydration</div>
                            <div id="timer-drink" class="text-7xl font-mono font-bold text-white mb-4 tracking-tighter">15:00</div>
                            <button id="btn-log-sip" class="w-full bg-slate-700 hover:bg-blue-600 text-blue-200 py-3 rounded-lg font-bold text-xs uppercase">
                                <i class="fa-solid fa-glass-water mr-2"></i> Log Sip
                            </button>
                        </div>

                        <div id="card-eat" class="bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center">
                            <div class="text-orange-400 text-xs uppercase font-bold tracking-widest mb-1">Fueling</div>
                            <div id="timer-eat" class="text-7xl font-mono font-bold text-white mb-4 tracking-tighter">45:00</div>
                            
                            <div class="w-full max-h-[300px] overflow-y-auto custom-scrollbar pr-1 mb-2">
                                <div id="fuel-menu-container" class="space-y-2">
                                    ${this.renderFuelButtons(state.fuelMenu)}
                                </div>
                            </div>
                            
                            <button id="btn-show-custom-fuel" class="text-[10px] text-slate-500 underline w-full text-center">Log Custom Amount</button>
                            <div id="custom-fuel-input-area" class="w-full mt-2 pt-2 border-t border-slate-700/50 hidden flex gap-2">
                                <input type="number" id="input-custom-carbs" placeholder="Custom g" class="w-24 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-center text-white">
                                <button id="btn-log-custom" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded px-2 py-1 text-xs font-bold">ADD</button>
                            </div>
                        </div>
                    </div>

                    <div class="bg-slate-900 rounded-xl border border-slate-800 p-4">
                        <div class="text-[10px] text-slate-500 uppercase font-bold mb-3 border-b border-slate-800 pb-2">Session Log</div>
                        <div id="fuel-history-log" class="space-y-1 max-h-[150px] overflow-y-auto custom-scrollbar text-sm text-slate-400">
                            <div class="italic opacity-50 text-xs">No intake yet.</div>
                        </div>
                    </div>
                </div>

                <div id="fuel-config-view" class="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 class="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2">Mission Control</h3>
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div><label class="block text-[10px] text-slate-400 uppercase font-bold mb-1">Drink (min)</label><input type="number" id="input-drink-int" value="${state.drinkInterval}" class="w-full bg-slate-900 border-slate-600 rounded p-2 text-white"></div>
                        <div><label class="block text-[10px] text-slate-400 uppercase font-bold mb-1">Eat (min)</label><input type="number" id="input-eat-int" value="${state.eatInterval}" class="w-full bg-slate-900 border-slate-600 rounded p-2 text-white"></div>
                        <div><label class="block text-[10px] text-blue-400 uppercase font-bold mb-1">Bottle (g)</label><input type="number" id="input-bottle-carbs" value="${state.carbsPerBottle}" class="w-full bg-slate-900 border-slate-600 rounded p-2 text-white"></div>
                        <div><label class="block text-[10px] text-emerald-400 uppercase font-bold mb-1">Target (g/hr)</label><input type="number" id="input-target-hourly" value="${state.targetHourlyCarbs}" class="w-full bg-slate-900 border-slate-600 rounded p-2 text-white"></div>
                    </div>
                    <div class="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <div class="text-[10px] text-slate-500 uppercase font-bold mb-2">Active Menu Items</div>
                        <div id="fuel-library-editor" class="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar mb-3">${this.renderFuelEditor(state.fuelMenu)}</div>
                        <div class="pt-3 border-t border-slate-700/50 flex gap-2">
                            <input type="text" id="new-item-name" placeholder="Name (e.g. Pizza)" class="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white">
                            <input type="number" id="new-item-carbs" placeholder="g" class="w-16 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white text-center">
                            <button id="btn-add-item" class="bg-emerald-600 hover:bg-emerald-500 text-white rounded px-3 py-1 text-xs font-bold uppercase transition-colors"><i class="fa-solid fa-plus"></i></button>
                        </div>
                    </div>
                </div>

                <div class="mt-6 grid grid-cols-1 gap-3">
                    <button id="btn-fuel-toggle" class="w-full py-4 rounded-xl font-bold text-xl uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg">Start Engine</button>
                    <button id="btn-fuel-reset" class="hidden w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest bg-slate-700 hover:bg-slate-600 text-slate-300">Reset / Configure</button>
                </div>
            </div>
        `;
    },

    // Renders the Two-Button Row Layout
    renderFuelButtons(menu) {
        const activeItems = menu.filter(i => i.active);
        if (activeItems.length === 0) return '<div class="text-xs text-slate-500 italic text-center p-2">No items active. Check settings.</div>';
        
        return activeItems.map(item => `
            <div class="flex gap-2 w-full h-16">
                <button class="btn-quick-fuel w-[30%] bg-slate-800 border border-slate-600 hover:bg-orange-900/40 text-slate-400 rounded-lg font-bold text-xs uppercase flex flex-col items-center justify-center transition-colors active:bg-orange-800"
                    data-carbs="${Math.round(item.carbs / 2)}" data-name="1/2 ${item.label}">
                    <span class="text-[9px] opacity-60">1/2</span>
                    <span>${Math.round(item.carbs / 2)}</span>
                </button>

                <button class="btn-quick-fuel flex-1 bg-slate-700 border border-slate-600 hover:bg-orange-600 hover:text-white text-slate-200 rounded-lg font-bold text-sm uppercase flex flex-col items-center justify-center transition-colors active:bg-emerald-600"
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

    // Renders the Scrolling History Log
    renderHistoryLog(log) {
        if (!log || log.length === 0) return '<div class="italic opacity-50 text-xs text-center py-2">Session started. Ready to log.</div>';
        
        // Show newest first
        return log.slice().reverse().map(entry => `
            <div class="flex justify-between items-center py-1 border-b border-slate-800/50 last:border-0 animate-fade-in">
                <span class="font-mono text-slate-500 text-xs">${entry.time}</span>
                <span class="text-slate-300">${entry.item}</span>
                <span class="font-bold ${entry.type === 'drink' ? 'text-blue-400' : 'text-emerald-400'}">${entry.carbs > 0 ? '+' + entry.carbs + 'g' : '-'}</span>
            </div>
        `).join('');
    },

    renderFuelEditor(menu) {
        return menu.map((item, index) => `
            <div class="flex gap-2 items-center bg-slate-800 p-2 rounded border border-slate-700">
                <button class="btn-toggle-active w-8 h-8 flex items-center justify-center rounded ${item.active ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-600 bg-slate-900'}" data-index="${index}"><i class="fa-solid ${item.active ? 'fa-eye' : 'fa-eye-slash'}"></i></button>
                <div class="w-6 text-center text-slate-500"><i class="fa-solid ${item.icon}"></i></div>
                <div class="flex-1 text-sm text-white">${item.label}</div>
                <div class="text-xs text-slate-400">${item.carbs}g</div>
            </div>
        `).join('');
    },

    formatTime(s) {
        const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
        const pad = (n) => String(n).padStart(2,'0');
        if(h>0) return `${h}:${pad(m)}:${pad(sec)}`;
        return `${pad(m)}:${pad(sec)}`;
    }
};
