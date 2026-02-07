import { FuelComponents } from './components.js';

export const FuelView = {
    // Proxy methods
    formatTime: FuelComponents.formatTime,
    renderHistoryLog: FuelComponents.renderHistoryLog,
    renderFuelButtons: FuelComponents.renderFuelButtons,
    renderFuelEditor: FuelComponents.renderFuelEditor,

    renderMarkers(count) {
        let html = '';
        for (let i = 1; i < count; i++) {
            const pct = (i / count) * 100;
            html += `<div class="absolute w-full h-[1px] bg-white/30" style="top: ${pct}%"></div>`;
        }
        return html;
    },

    getHtml(state) {
        const bottleLines = this.renderMarkers(state.sipsPerBottle);
        const flaskLines = this.renderMarkers(state.squeezesPerFlask);

        return `
            <div class="p-2 max-w-5xl mx-auto pb-48 relative">
                
                <div class="flex justify-between items-center mb-4 mt-1 pl-14 pr-2">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <div id="pulse-indicator" class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span class="text-[10px] text-slate-400 uppercase tracking-widest">Ride Time</span>
                        </div>
                        <div class="text-4xl font-mono font-bold text-white leading-none tracking-tight" id="fuel-total-time">00:00:00</div>
                    </div>
                    
                    <div class="flex flex-col items-end gap-1">
                        <button id="btn-fuel-help" class="text-slate-500 hover:text-white transition-colors">
                            <i class="fa-solid fa-circle-question text-xl"></i>
                        </button>
                        <div class="text-[10px] font-mono text-slate-500">
                            Plan: ${Math.floor(state.plannedDuration/60)}h ${state.plannedDuration%60}m
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-2 mb-4">
                    <div class="bg-slate-900 p-2 rounded-xl border border-slate-800 flex flex-col items-center shadow-lg">
                        <div class="text-[10px] text-blue-400 uppercase font-bold mb-2">Mix</div>
                        <div class="relative w-10 h-14 border-2 border-slate-600 rounded-b-xl rounded-t-md bg-slate-800/50 overflow-hidden">
                            <div id="mix-bottle-liquid" class="absolute bottom-0 left-0 w-full bg-blue-600 transition-all duration-1000" style="height: 100%;"></div>
                            ${bottleLines}
                        </div>
                        <div class="text-xs text-slate-400 mt-2 font-mono">#<span id="mix-bottle-count" class="text-white font-bold">1</span></div>
                    </div>
                    <div class="bg-slate-900 p-2 rounded-xl border border-slate-800 flex flex-col items-center shadow-lg">
                        <div class="text-[10px] text-cyan-400 uppercase font-bold mb-2">Water</div>
                        <div class="relative w-10 h-14 border-2 border-slate-600 rounded-b-xl rounded-t-md bg-slate-800/50 overflow-hidden">
                            <div id="water-bottle-liquid" class="absolute bottom-0 left-0 w-full bg-cyan-600 transition-all duration-1000" style="height: 100%;"></div>
                            ${bottleLines}
                        </div>
                        <div class="text-xs text-slate-400 mt-2 font-mono">#<span id="water-bottle-count" class="text-white font-bold">1</span></div>
                    </div>
                    <div class="bg-slate-900 p-2 rounded-xl border border-slate-800 flex flex-col items-center shadow-lg">
                        <div class="text-[10px] text-orange-400 uppercase font-bold mb-2">Flask</div>
                        <div class="relative w-10 h-14 border-2 border-slate-600 rounded-lg bg-slate-800/50 overflow-hidden">
                            <div id="flask-liquid" class="absolute bottom-0 left-0 w-full bg-orange-500 transition-all duration-1000" style="height: 100%;"></div>
                            ${flaskLines}
                        </div>
                        <div class="text-xs text-slate-400 mt-2 font-mono">#<span id="flask-count" class="text-white font-bold">1</span></div>
                    </div>
                </div>

                <div class="bg-slate-900 p-3 rounded-xl border border-slate-700 mb-4 flex flex-col gap-3 shadow-lg">
                    <div>
                        <div class="flex justify-between items-end mb-1">
                            <div class="text-[10px] text-emerald-400 uppercase font-bold">Carbs (g)</div>
                            <div class="text-[10px] text-slate-300 font-mono"><span id="carb-val">0</span> / <span id="carb-pacer">0</span></div>
                        </div>
                        <div class="w-full h-3 bg-slate-800 rounded-full overflow-hidden relative border border-slate-600">
                            <div id="carb-progress-bar" class="h-full bg-emerald-600 transition-all duration-500" style="width: 0%"></div>
                            <div id="carb-pacer-marker" class="absolute top-0 bottom-0 w-[3px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10" style="left: 0%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between items-end mb-1">
                            <div class="text-[10px] text-cyan-400 uppercase font-bold">Fluid (ml)</div>
                            <div class="text-[10px] text-slate-300 font-mono"><span id="fluid-val">0</span> / <span id="fluid-pacer">0</span></div>
                        </div>
                        <div class="w-full h-3 bg-slate-800 rounded-full overflow-hidden relative border border-slate-600">
                            <div id="fluid-progress-bar" class="h-full bg-cyan-600 transition-all duration-500" style="width: 0%"></div>
                            <div id="fluid-pacer-marker" class="absolute top-0 bottom-0 w-[3px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10" style="left: 0%"></div>
                        </div>
                    </div>
                </div>

                <div id="fuel-active-view" class="hidden">
                    <div class="flex flex-col gap-3 mb-6">
                        
                        <div id="card-drink" class="bg-slate-800 border-2 border-slate-700 rounded-xl p-2 flex gap-2 h-20 shadow-xl">
                            <div class="w-20 bg-slate-900 rounded-lg flex flex-col items-center justify-center border border-slate-700">
                                <span class="text-[8px] text-blue-400 font-bold uppercase tracking-widest mb-1">Hydrate</span>
                                <span id="timer-drink" class="text-xl font-mono font-bold text-white">15:00</span>
                            </div>
                            
                            <button id="btn-log-sip-mix" class="flex-1 bg-blue-600 active:bg-blue-500 hover:bg-blue-500 text-white rounded-lg border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center justify-center">
                                <span class="text-[10px] opacity-80 uppercase">Mix</span>
                                <span class="text-sm font-bold uppercase">SIP</span>
                            </button>
                            
                            <button id="btn-log-sip-water" class="flex-1 bg-slate-700 active:bg-cyan-600 hover:bg-slate-600 text-cyan-100 active:text-white rounded-lg border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center justify-center">
                                <span class="text-[10px] opacity-80 uppercase">Water</span>
                                <span class="text-sm font-bold uppercase">SIP</span>
                            </button>
                        </div>

                        <div id="card-eat" class="bg-slate-800 border-2 border-slate-700 rounded-xl p-2 flex gap-2 h-20 shadow-xl">
                            <div class="w-20 bg-slate-900 rounded-lg flex flex-col items-center justify-center border border-slate-700">
                                <span class="text-[8px] text-orange-400 font-bold uppercase tracking-widest mb-1">Fuel</span>
                                <span id="timer-eat" class="text-xl font-mono font-bold text-white">45:00</span>
                            </div>
                            
                            <button id="btn-log-flask" class="flex-1 bg-orange-600 active:bg-orange-500 hover:bg-orange-500 text-white rounded-lg border-b-4 border-orange-800 active:border-b-0 active:translate-y-1 transition-all flex flex-col items-center justify-center">
                                <div class="flex items-center gap-2">
                                    <i class="fa-solid fa-bottle-droplet text-lg"></i>
                                    <span class="text-sm font-bold uppercase">Flask Squeeze</span>
                                </div>
                            </button>
                        </div>

                        <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                            <div class="flex justify-between items-center mb-2 px-1">
                                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Solid Food Menu</span>
                                <button id="btn-show-custom-fuel" class="text-[10px] text-blue-400 hover:text-blue-300 underline">Custom</button>
                            </div>
                            
                            <div id="fuel-menu-container" class="space-y-2">
                                ${FuelComponents.renderFuelButtons(state.fuelMenu)}
                            </div>

                            <div id="custom-fuel-input-area" class="hidden mt-3 p-2 bg-slate-800 rounded border border-slate-700 flex gap-2">
                                <input type="number" id="input-custom-carbs" placeholder="Grams" class="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white text-center">
                                <button id="btn-log-custom" class="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider">Log Carbs</button>
                            </div>
                        </div>

                    </div>

                    <div class="bg-slate-900 rounded-xl border border-slate-800 p-3 mb-6 shadow-inner">
                        <div class="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                            <span class="text-[10px] text-slate-500 uppercase font-bold tracking-widest">History</span>
                            <span class="text-[10px] text-slate-600 italic">Tap to remove</span>
                        </div>
                        <div id="fuel-history-log" class="space-y-1 max-h-[100px] overflow-y-auto custom-scrollbar text-xs text-slate-400"></div>
                    </div>
                </div>

                <div id="fuel-config-view" class="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-6 shadow-2xl">
                    <h3 class="text-sm font-bold text-white mb-4 border-b border-slate-700 pb-2 flex items-center gap-2">
                        <i class="fa-solid fa-sliders text-blue-400"></i> Mission Control
                    </h3>
                    
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50 col-span-2 lg:col-span-1">
                            <label class="block text-[10px] text-purple-400 uppercase font-bold mb-1">Ride Time (min)</label>
                            <input type="number" id="input-planned-duration" value="${state.plannedDuration}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white text-xs">
                        </div>
                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                            <label class="block text-[10px] text-emerald-400 uppercase font-bold mb-1">Target Carbs/Hr</label>
                            <input type="number" id="input-target-hourly" value="${state.targetHourlyCarbs}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white text-xs">
                        </div>
                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                            <label class="block text-[10px] text-cyan-400 uppercase font-bold mb-1">Target Fluid/Hr</label>
                            <input type="number" id="input-target-fluid" value="${state.targetHourlyFluid}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white text-xs">
                        </div>
                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                             <label class="block text-[10px] text-slate-400 uppercase font-bold mb-1">Drink Timer</label>
                             <input type="number" id="input-drink-int" value="${state.drinkInterval}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white text-xs">
                        </div>
                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                             <label class="block text-[10px] text-slate-400 uppercase font-bold mb-1">Eat Timer</label>
                             <input type="number" id="input-eat-int" value="${state.eatInterval}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white text-xs">
                        </div>

                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                            <label class="block text-[10px] text-blue-400 uppercase font-bold mb-1">Bottle Vol (ml)</label>
                            <input type="number" id="input-bottle-vol" value="${state.bottleVolume}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white text-xs">
                        </div>
                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                            <label class="block text-[10px] text-blue-400 uppercase font-bold mb-1">Mix Strength (g)</label>
                            <input type="number" id="input-bottle-carbs" value="${state.carbsPerBottle}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white text-xs">
                        </div>

                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                            <label class="block text-[10px] text-blue-400 uppercase font-bold mb-1">Sips/Bottle</label>
                            <input type="number" id="input-sips-bottle" value="${state.sipsPerBottle}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white text-xs">
                        </div>
                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                            <label class="block text-[10px] text-orange-400 uppercase font-bold mb-1">Squeezes/Flask</label>
                            <input type="number" id="input-sqz-flask" value="${state.squeezesPerFlask}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white text-xs">
                        </div>
                        <div class="bg-slate-900/50 p-2 rounded border border-slate-700/50 col-span-2">
                            <label class="block text-[10px] text-orange-400 uppercase font-bold mb-1">Flask Capacity (g Carbs)</label>
                            <input type="number" id="input-flask-carbs" value="${state.carbsPerFlask}" class="w-full bg-slate-800 border-slate-600 rounded p-1 text-white text-xs">
                        </div>
                    </div>
                    
                    <div class="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-xs text-slate-500 uppercase font-bold">Solid Food Items</span>
                            <button id="btn-toggle-all-fuel" class="text-[10px] text-blue-400 hover:text-blue-300 font-bold px-2 py-1 uppercase tracking-wider">Toggle All</button>
                        </div>
                        <div id="fuel-library-editor" class="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar mb-4">${FuelComponents.renderFuelEditor(state.fuelMenu)}</div>
                        
                        <div class="pt-3 border-t border-slate-700/50 flex gap-2">
                            <input type="text" id="new-item-name" placeholder="Name" class="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white">
                            <input type="number" id="new-item-carbs" placeholder="g" class="w-16 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white text-center">
                            <button id="btn-add-item" class="bg-emerald-600 hover:bg-emerald-500 text-white rounded px-4 py-2 text-xs font-bold uppercase shadow-lg"><i class="fa-solid fa-plus"></i></button>
                        </div>
                    </div>
                </div>

                <div class="mt-6 flex flex-col gap-3">
                    <button id="btn-fuel-toggle" class="w-full py-4 rounded-xl font-bold text-xl uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl transition-all">Start Engine</button>
                    <button id="btn-fuel-reset" class="hidden w-full py-3 rounded-xl font-bold text-sm uppercase bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">End Session / Configure</button>
                </div>

                <div id="fuel-help-modal" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                     <div class="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl">
                        <h3 class="font-bold text-white uppercase mb-4 tracking-widest">Cockpit Manual</h3>
                        <div class="space-y-4 text-xs text-slate-400 mb-6">
                            <p><strong>1. Inventory:</strong> Visual trackers for your mix, water, and flask. These empty as you log sips.</p>
                            <p><strong>2. Pacers:</strong> Horizontal bars show your total ride progress. Keep the colored bar ahead of the white line.</p>
                            <p><strong>3. Controls:</strong> 
                                <br>• <span class="text-blue-400">Mix:</span> Carbs + Fluid.
                                <br>• <span class="text-cyan-400">Water:</span> Fluid only.
                                <br>• <span class="text-orange-400">Flask:</span> Concentrated Carbs only.
                            </p>
                        </div>
                        <button id="btn-dismiss-help" class="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider">Dismiss</button>
                     </div>
                </div>
            </div>
        `;
    }
};
