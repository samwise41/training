import { FuelComponents } from './components.js';

export const FuelView = {
    formatTime: FuelComponents.formatTime,
    renderHistoryLog: FuelComponents.renderHistoryLog,
    renderFuelButtons: FuelComponents.renderFuelButtons,
    renderFuelEditor: FuelComponents.renderFuelEditor,

    renderMarkers(count) {
        let html = '';
        for (let i = 1; i < count; i++) {
            const pct = (i / count) * 100;
            html += `<div class="absolute w-full h-[1px] bg-white/20" style="top: ${pct}%"></div>`;
        }
        return html;
    },

    getHtml(state) {
        const bottleLines = this.renderMarkers(state.sipsPerBottle);
        const flaskLines = this.renderMarkers(state.squeezesPerFlask);

        return `
            <div class="p-4 max-w-5xl mx-auto pb-48 relative">
                
                <button id="btn-fuel-help" class="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-20">
                    <i class="fa-solid fa-circle-question text-xl"></i>
                </button>

                <div class="mb-4 bg-slate-900 p-5 rounded-xl border border-slate-700 flex flex-col justify-center relative overflow-hidden">
                    <div class="flex justify-between items-start">
                        <div class="text-xs text-slate-500 uppercase tracking-widest mb-1">Ride Time</div>
                        <div id="pulse-indicator" class="h-2 w-2 rounded-full bg-slate-800"></div>
                    </div>
                    <div id="fuel-total-time" class="text-5xl font-mono font-bold text-white tracking-tighter z-10">00:00:00</div>
                    <div class="text-[10px] text-slate-600 mt-1">Plan: ${Math.floor(state.plannedDuration/60)}h ${state.plannedDuration%60}m</div>
                </div>

                <div class="grid grid-cols-3 gap-2 mb-4">
                    <div class="bg-slate-900 p-2 rounded-xl border border-slate-700 flex flex-col items-center">
                        <div class="text-[9px] text-blue-400 uppercase font-bold mb-1">Mix</div>
                        <div class="relative w-8 h-14 border border-slate-600 rounded-b-lg rounded-t-sm bg-slate-800/50 overflow-hidden">
                            <div id="mix-bottle-liquid" class="absolute bottom-0 left-0 w-full bg-blue-600 transition-all duration-1000" style="height: 100%;"></div>
                            ${bottleLines}
                        </div>
                        <div class="text-[9px] text-slate-500 mt-1">#<span id="mix-bottle-count" class="text-white font-bold">1</span></div>
                    </div>
                    <div class="bg-slate-900 p-2 rounded-xl border border-slate-700 flex flex-col items-center">
                        <div class="text-[9px] text-cyan-400 uppercase font-bold mb-1">Water</div>
                        <div class="relative w-8 h-14 border border-slate-600 rounded-b-lg rounded-t-sm bg-slate-800/50 overflow-hidden">
                            <div id="water-bottle-liquid" class="absolute bottom-0 left-0 w-full bg-cyan-600 transition-all duration-1000" style="height: 100%;"></div>
                            ${bottleLines}
                        </div>
                        <div class="text-[9px] text-slate-500 mt-1">#<span id="water-bottle-count" class="text-white font-bold">1</span></div>
                    </div>
                    <div class="bg-slate-900 p-2 rounded-xl border border-slate-700 flex flex-col items-center">
                        <div class="text-[9px] text-orange-400 uppercase font-bold mb-1">Flask</div>
                        <div class="relative w-8 h-14 border border-slate-600 rounded-lg bg-slate-800/50 overflow-hidden">
                            <div id="flask-liquid" class="absolute bottom-0 left-0 w-full bg-orange-500 transition-all duration-1000" style="height: 100%;"></div>
                            ${flaskLines}
                        </div>
                        <div class="text-[9px] text-slate-500 mt-1">#<span id="flask-count" class="text-white font-bold">1</span></div>
                    </div>
                </div>

                <div class="bg-slate-900 p-4 rounded-xl border border-slate-700 mb-6 flex flex-col gap-4">
                    <div>
                        <div class="flex justify-between items-end mb-1">
                            <div class="text-[10px] text-emerald-400 uppercase font-bold">Carbs (g)</div>
                            <div class="text-xs text-slate-300 font-mono"><span id="carb-val">0</span> / <span id="carb-pacer">0</span></div>
                        </div>
                        <div class="w-full h-4 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
                            <div id="carb-progress-bar" class="h-full bg-emerald-600 transition-all duration-500" style="width: 0%"></div>
                            <div id="carb-pacer-marker" class="absolute top-0 bottom-0 w-[2px] bg-white shadow-glow z-10" style="left: 0%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between items-end mb-1">
                            <div class="text-[10px] text-cyan-400 uppercase font-bold">Fluid (ml)</div>
                            <div class="text-xs text-slate-300 font-mono"><span id="fluid-val">0</span> / <span id="fluid-pacer">0</span></div>
                        </div>
                        <div class="w-full h-4 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
                            <div id="fluid-progress-bar" class="h-full bg-cyan-600 transition-all duration-500" style="width: 0%"></div>
                            <div id="fluid-pacer-marker" class="absolute top-0 bottom-0 w-[2px] bg-white shadow-glow z-10" style="left: 0%"></div>
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
                            
                            <button id="btn-log-flask" class="w-full mb-3 bg-orange-600 active:bg-orange-500 md:hover:bg-orange-500 text-white py-3 rounded-lg font-bold text-sm uppercase transition-colors border-b-4 border-orange-800 active:border-b-0 active:translate-y-1 flex items-center justify-center gap-2">
                                <i class="fa-solid fa-bottle-droplet"></i> Flask Squeeze
                            </button>

                            <div class="w-full max-h-[180px] overflow-y-auto custom-scrollbar pr-1 mb-2 border-t border-slate-700 pt-2">
                                <div id="fuel-menu-container" class="space-y-2">
                                    ${FuelComponents.renderFuelButtons(state.fuelMenu)}
                                </div>
                            </div>
                            
                            <button id="btn-show-custom-fuel" class="text-[10px] text-slate-500 underline w-full text-center py-2">Log Custom Amount</button>
                            <div id="custom-fuel-input-area" class="w-full mt-2 hidden flex gap-2">
                                <input type="number" id="input-custom-carbs" placeholder="g" class="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-center">
                                <button id="btn-log-custom" class="flex-1 bg-slate-700 text-white rounded px-2 py-1 text-xs font-bold">ADD</button>
                            </div>
                        </div>
                    </div>
                    <div class="bg-slate-900 rounded-xl border border-slate-800 p-4 mb-6">
                        <div class="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                            <span class="text-[10px] text-slate-500 uppercase font-bold">Log</span>
                            <span class="text-[9px] text-slate-600 italic">Tap to remove</span>
                        </div>
                        <div id="fuel-history-log" class="space-y-1 max-h-[150px] overflow-y-auto custom-scrollbar text-sm text-slate-400"></div>
                    </div>
                </div>

                <div id="fuel-config-view" class="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
                    <h3 class="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2">Mission Control</h3>
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        
                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50 col-span-2 lg:col-span-1">
                            <label class="block text-[10px] text-purple-400 uppercase font-bold mb-1">Ride Time (min)</label>
                            <input type="number" id="input-planned-duration" value="${state.plannedDuration}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white">
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
                             <label class="block text-[10px] text-slate-400 uppercase font-bold mb-1">Drink Timer</label>
                             <input type="number" id="input-drink-int" value="${state.drinkInterval}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white">
                        </div>
                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                             <label class="block text-[10px] text-slate-400 uppercase font-bold mb-1">Eat Timer</label>
                             <input type="number" id="input-eat-int" value="${state.eatInterval}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white">
                        </div>

                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                            <label class="block text-[10px] text-blue-400 uppercase font-bold mb-1">Bottle Vol (ml)</label>
                            <input type="number" id="input-bottle-vol" value="${state.bottleVolume}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white">
                        </div>
                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                            <label class="block text-[10px] text-blue-400 uppercase font-bold mb-1">Mix Strength (g)</label>
                            <input type="number" id="input-bottle-carbs" value="${state.carbsPerBottle}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white">
                        </div>

                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                            <label class="block text-[10px] text-blue-400 uppercase font-bold mb-1">Sips/Bottle</label>
                            <input type="number" id="input-sips-bottle" value="${state.sipsPerBottle}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white">
                        </div>
                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                            <label class="block text-[10px] text-orange-400 uppercase font-bold mb-1">Squeezes/Flask</label>
                            <input type="number" id="input-sqz-flask" value="${state.squeezesPerFlask}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white">
                        </div>
                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50 col-span-2">
                            <label class="block text-[10px] text-orange-400 uppercase font-bold mb-1">Flask Capacity (g Carbs)</label>
                            <input type="number" id="input-flask-carbs" value="${state.carbsPerFlask}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white">
                        </div>

                    </div>
                    
                    <div class="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-[10px] text-slate-500 uppercase font-bold">Active Menu Items</span>
                            <button id="btn-toggle-all-fuel" class="text-[10px] text-blue-400 hover:text-blue-300 underline font-bold px-2 py-1">Select / Unselect All</button>
                        </div>
                        <div id="fuel-library-editor" class="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar mb-3">${FuelComponents.renderFuelEditor(state.fuelMenu)}</div>
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
                            <div>
                                <h4 class="text-emerald-400 font-bold uppercase text-xs mb-2">Inventory</h4>
                                <ul class="list-disc pl-4 space-y-1 text-xs text-slate-400">
                                    <li><span class="text-blue-400 font-bold">Mix:</span> Carb Drink bottles.</li>
                                    <li><span class="text-cyan-400 font-bold">Water:</span> Plain Water bottles.</li>
                                    <li><span class="text-orange-400 font-bold">Flask:</span> Homemade Gel Flasks.</li>
                                </ul>
                            </div>
                            <div>
                                <h4 class="text-emerald-400 font-bold uppercase text-xs mb-2">Controls</h4>
                                <ul class="list-disc pl-4 space-y-1 text-xs text-slate-400">
                                    <li><span class="text-blue-400 font-bold">MIX SIP:</span> +Fluid, +Carbs.</li>
                                    <li><span class="text-cyan-400 font-bold">WATER SIP:</span> +Fluid only.</li>
                                    <li><span class="text-orange-400 font-bold">FLASK:</span> +Carbs (1/4 flask).</li>
                                </ul>
                            </div>
                        </div>
                        <div class="p-4 border-t border-slate-800">
                            <button id="btn-dismiss-help" class="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-bold text-xs uppercase">Got it</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};
