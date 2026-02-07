export const FuelView = {
    getHtml(state) {
        return `
            <div class="p-4 max-w-5xl mx-auto pb-48">
                
                <div class="grid grid-cols-12 gap-4 mb-6">
                    
                    <div class="col-span-12 md:col-span-4 bg-slate-900 p-5 rounded-xl border border-slate-700 flex flex-col justify-center relative overflow-hidden">
                        <div class="flex justify-between items-start">
                            <div class="text-xs text-slate-500 uppercase tracking-widest mb-1">Ride Time</div>
                            <div id="pulse-indicator" class="h-2 w-2 rounded-full bg-slate-800"></div>
                        </div>
                        <div id="fuel-total-time" class="text-5xl font-mono font-bold text-white tracking-tighter z-10">00:00:00</div>
                        <div class="text-[10px] text-slate-600 mt-1">Plan: ${Math.floor(state.plannedDuration/60)}h ${state.plannedDuration%60}m</div>
                    </div>

                    <div class="col-span-12 md:col-span-4 bg-slate-900 p-4 rounded-xl border border-slate-700">
                         <div class="flex justify-between items-end h-full gap-4">
                            
                            <div class="flex-1 flex flex-col items-center">
                                <div class="text-[10px] text-blue-400 uppercase font-bold mb-1">Mix Pacer</div>
                                <div class="relative w-10 h-16">
                                    <div class="w-full h-full border-2 border-slate-600 rounded-b-lg rounded-t-sm bg-slate-800/50 overflow-hidden relative">
                                        <div id="mix-bottle-liquid" class="absolute bottom-0 left-0 w-full bg-blue-600 transition-all duration-1000" style="height: 100%;"></div>
                                    </div>
                                </div>
                                <div class="text-[10px] text-slate-500 mt-1 text-center">
                                    <span id="mix-bottle-count" class="font-bold text-white">0</span> Consumed
                                </div>
                            </div>

                            <div class="flex-1 flex flex-col items-center">
                                <div class="text-[10px] text-cyan-400 uppercase font-bold mb-1">Water</div>
                                <div class="relative w-10 h-16">
                                    <div class="w-full h-full border-2 border-slate-600 rounded-b-lg rounded-t-sm bg-slate-800/50 overflow-hidden relative">
                                        <div id="water-bottle-liquid" class="absolute bottom-0 left-0 w-full bg-cyan-600 transition-all duration-1000" style="height: 100%;"></div>
                                    </div>
                                </div>
                                <div class="text-[10px] text-slate-500 mt-1 text-center">
                                    <span id="water-bottle-count" class="font-bold text-white">0</span> Consumed
                                </div>
                            </div>

                         </div>
                    </div>

                    <div class="col-span-12 md:col-span-4 bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col justify-between">
                        
                        <div class="flex justify-between items-end border-b border-slate-800 pb-2 mb-2">
                            <div>
                                <div class="text-[10px] text-slate-500 uppercase tracking-widest">Carbs</div>
                                <div class="flex items-baseline gap-1">
                                    <span id="fuel-consumed-display" class="text-2xl font-bold text-emerald-400 leading-none">0</span>
                                    <span class="text-xs text-slate-400">g</span>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-[10px] text-slate-500 uppercase tracking-widest">Fluid</div>
                                <div class="flex items-baseline gap-1 justify-end">
                                    <span id="fluid-consumed-display" class="text-xl font-bold text-cyan-400 leading-none">0</span>
                                    <span class="text-xs text-slate-400">ml</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div class="flex justify-between text-[10px] text-slate-500 uppercase mb-1">
                                <span>Ride Progress</span>
                                <span id="mission-target-text">0 / 0g</span>
                            </div>
                            <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div id="mission-progress-bar" class="h-full bg-emerald-600 w-0 transition-all duration-1000"></div>
                            </div>
                            <div id="mission-status-msg" class="text-[10px] text-slate-600 text-right mt-1 italic">On Track</div>
                        </div>
                    </div>
                </div>

                <div id="fuel-active-view" class="hidden">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        
                        <div id="card-drink" class="bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center">
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

                        <div id="card-eat" class="bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center">
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

                    <div class="bg-slate-900 rounded-xl border border-slate-800 p-4 mb-6">
                        <div class="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                            <span class="text-[10px] text-slate-500 uppercase font-bold">Session Intake Log</span>
                            <span class="text-[9px] text-slate-600 italic">Tap item to remove</span>
                        </div>
                        <div id="fuel-history-log" class="space-y-1 max-h-[150px] overflow-y-auto custom-scrollbar text-sm text-slate-400">
                            <div class="italic opacity-50 text-xs text-center py-2">No intake recorded yet.</div>
                        </div>
                    </div>
                </div>

                <div id="fuel-config-view" class="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
                    <h3 class="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2">Mission Control</h3>
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div><label class="block text-[10px] text-slate-400 uppercase font-bold mb-1">Drink (min)</label><input type="number" id="input-drink-int" value="${state.drinkInterval}" class="w-full bg-slate-900 border-slate-600 rounded p-2 text-white"></div>
                        <div><label class="block text-[10px] text-slate-400 uppercase font-bold mb-1">Eat (min)</label><input type="number" id="input-eat-int" value="${state.eatInterval}" class="w-full bg-slate-900 border-slate-600 rounded p-2 text-white"></div>
                        <div><label class="block text-[10px] text-blue-400 uppercase font-bold mb-1">Carbs/Bottle (g)</label><input type="number" id="input-bottle-carbs" value="${state.carbsPerBottle}" class="w-full bg-slate-900 border-slate-600 rounded p-2 text-white"></div>
                        <div><label class="block text-[10px] text-emerald-400 uppercase font-bold mb-1">Target (g/hr)</label><input type="number" id="input-target-hourly" value="${state.targetHourlyCarbs}" class="w-full bg-slate-900 border-slate-600 rounded p-2 text-white"></div>
                        <div class="col-span-2"><label class="block text-[10px] text-purple-400 uppercase font-bold mb-1">Ride Duration (min)</label><input type="number" id="input-planned-duration" value="${state.plannedDuration}" class="w-full bg-slate-900 border-slate-600 rounded p-2 text-white"></div>
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
            </div>
        `;
    },

    renderFuelButtons(menu) {
        const activeItems = menu.filter(i => i.active);
        if (activeItems.length === 0) return '<div class="text-xs text-slate-500 italic text-center p-4 border border-slate-700/50 rounded-lg">No items active.<br>Enable them in settings below.</div>';
        
        return activeItems.map(item => `
            <div class="flex gap-2 w-full h-14">
                <button class="btn-quick-fuel w-[30%] bg-slate-800 border border-slate-600 active:bg-slate-600 active:border-slate-500 md:hover:border-slate-400 text-slate-400 rounded-lg font-bold text-xs uppercase flex flex-col items-center justify-center transition-all"
                    data-carbs="${Math.round(item.carbs / 2)}" data-name="1/2 ${item.label}">
                    <span class="text-[9px] opacity-60">1/2</span>
                    <span>${Math.round(item.carbs / 2)}</span>
                </button>
                <button class="btn-quick-fuel flex-1 bg-slate-700 border border-slate-600 active:bg-orange-600 active:text-white md:hover:bg-slate-600 text-slate-200 rounded-lg font-bold text-sm uppercase flex flex-col items-center justify-center transition-all"
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
    },

    formatTime(s) {
        const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
        const pad = (n) => String(n).padStart(2,'0');
        if(h>0) return `${h}:${pad(m)}:${pad(sec)}`;
        return `${pad(m)}:${pad(sec)}`;
    }
};
