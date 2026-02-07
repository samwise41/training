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
            html += `<div class="absolute w-full h-[1px] bg-white/20" style="top: ${pct}%"></div>`;
        }
        return html;
    },

    getHtml(state) {
        const bottleLines = this.renderMarkers(state.sipsPerBottle);
        const flaskLines = this.renderMarkers(state.squeezesPerFlask);

        return `
            <div class="p-2 max-w-5xl mx-auto pb-48 relative">
                
                <div class="fixed top-1 left-16 right-2 z-40 flex justify-between items-center h-10 pointer-events-none">
                    <div class="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700 pointer-events-auto shadow-lg">
                        <div id="pulse-indicator" class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <div class="text-sm font-mono font-bold text-white tracking-widest" id="fuel-total-time">00:00:00</div>
                    </div>
                    <div class="flex items-center gap-2 pointer-events-auto">
                        <div class="hidden xs:block text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-700 uppercase">Plan: ${Math.floor(state.plannedDuration/60)}h</div>
                        <button id="btn-fuel-help" class="h-8 w-8 flex items-center justify-center bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-full text-slate-400 hover:text-white shadow-lg transition-all">
                            <i class="fa-solid fa-circle-question text-sm"></i>
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-1 mb-2 mt-10">
                    <div class="bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 flex flex-col items-center">
                        <div class="text-[9px] text-blue-400 uppercase font-bold mb-1">Mix</div>
                        <div class="relative w-8 h-10 border border-slate-700 rounded-b-lg rounded-t-sm bg-slate-800/50 overflow-hidden">
                            <div id="mix-bottle-liquid" class="absolute bottom-0 left-0 w-full bg-blue-600 transition-all duration-1000" style="height: 100%;"></div>
                            ${bottleLines}
                        </div>
                        <div class="text-[9px] text-slate-500 mt-1">#<span id="mix-bottle-count" class="text-white font-bold">1</span></div>
                    </div>
                    <div class="bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 flex flex-col items-center">
                        <div class="text-[9px] text-cyan-400 uppercase font-bold mb-1">Water</div>
                        <div class="relative w-8 h-10 border border-slate-700 rounded-b-lg rounded-t-sm bg-slate-800/50 overflow-hidden">
                            <div id="water-bottle-liquid" class="absolute bottom-0 left-0 w-full bg-cyan-600 transition-all duration-1000" style="height: 100%;"></div>
                            ${bottleLines}
                        </div>
                        <div class="text-[9px] text-slate-500 mt-1">#<span id="water-bottle-count" class="text-white font-bold">1</span></div>
                    </div>
                    <div class="bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 flex flex-col items-center">
                        <div class="text-[9px] text-orange-400 uppercase font-bold mb-1">Flask</div>
                        <div class="relative w-8 h-10 border border-slate-700 rounded-lg bg-slate-800/50 overflow-hidden">
                            <div id="flask-liquid" class="absolute bottom-0 left-0 w-full bg-orange-500 transition-all duration-1000" style="height: 100%;"></div>
                            ${flaskLines}
                        </div>
                        <div class="text-[9px] text-slate-500 mt-1">#<span id="flask-count" class="text-white font-bold">1</span></div>
                    </div>
                </div>

                <div class="bg-slate-900 p-2 rounded-xl border border-slate-700 mb-2 flex flex-col gap-2">
                    <div>
                        <div class="flex justify-between items-end mb-1">
                            <div class="text-[9px] text-emerald-400 uppercase font-bold">Carbs</div>
                            <div class="text-[9px] text-slate-300 font-mono"><span id="carb-val">0</span> / <span id="carb-pacer">0</span></div>
                        </div>
                        <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
                            <div id="carb-progress-bar" class="h-full bg-emerald-600 transition-all duration-500" style="width: 0%"></div>
                            <div id="carb-pacer-marker" class="absolute top-0 bottom-0 w-[2px] bg-white shadow-glow z-10" style="left: 0%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between items-end mb-1">
                            <div class="text-[9px] text-cyan-400 uppercase font-bold">Fluid</div>
                            <div class="text-[9px] text-slate-300 font-mono"><span id="fluid-val">0</span> / <span id="fluid-pacer">0</span></div>
                        </div>
                        <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
                            <div id="fluid-progress-bar" class="h-full bg-cyan-600 transition-all duration-500" style="width: 0%"></div>
                            <div id="fluid-pacer-marker" class="absolute top-0 bottom-0 w-[2px] bg-white shadow-glow z-10" style="left: 0%"></div>
                        </div>
                    </div>
                </div>

                <div id="fuel-active-view" class="hidden">
                    <div class="flex flex-col gap-2 mb-4">
                        
                        <div id="card-drink" class="bg-slate-800 border border-slate-700 rounded-xl p-1 flex items-stretch gap-1 h-14">
                            <div class="w-16 bg-slate-900 rounded-lg flex flex-col items-center justify-center border border-slate-700/50">
                                <span class="text-[8px] text-blue-400 font-bold uppercase tracking-wider">Drink</span>
                                <span id="timer-drink" class="text-lg font-mono font-bold text-white leading-none">15:00</span>
                            </div>
                            <button id="btn-log-sip-mix" class="flex-1 bg-blue-600 active:bg-blue-500 text-white rounded-lg font-bold text-[10px] uppercase border-b-2 border-blue-800 active:border-b-0 flex flex-col justify-center items-center">
                                <span>MIX</span>
                            </button>
                            <button id="btn-log-sip-water" class="flex-1 bg-slate-700 active:bg-cyan-600 text-cyan-100 active:text-white rounded-lg font-bold text-[10px] uppercase border-b-2 border-slate-900 active:border-b-0 flex flex-col justify-center items-center">
                                <span>WATER</span>
                            </button>
                        </div>

                        <div id="card-eat" class="bg-slate-800 border border-slate-700 rounded-xl p-1 flex items-stretch gap-1 h-14">
                            <div class="w-16 bg-slate-900 rounded-lg flex flex-col items-center justify-center border border-slate-700/50">
                                <span class="text-[8px] text-orange-400 font-bold uppercase tracking-wider">Eat</span>
                                <span id="timer-eat" class="text-lg font-mono font-bold text-white leading-none">45:00</span>
                            </div>
                            <button id="btn-log-flask" class="flex-1 bg-orange-600 active:bg-orange-500 text-white rounded-lg font-bold text-[10px] uppercase border-b-2 border-orange-800 active:border-b-0 flex items-center justify-center gap-2">
                                <i class="fa-solid fa-bottle-droplet"></i> FLASK SQUEEZE
                            </button>
                        </div>

                        <div class="bg-slate-900/40 border border-slate-800 rounded-xl p-2">
                            <div class="flex justify-between items-center mb-2 px-1">
                                <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Solid Food</span>
                                <button id="btn-show-custom-fuel" class="text-[9px] text-blue-400 underline">Custom</button>
                            </div>
                            
                            <div id="fuel-menu-container" class="space-y-1">
                                ${FuelComponents.renderFuelButtons(state.fuelMenu)}
                            </div>

                            <div id="custom-fuel-input-area" class="hidden mt-2 p-2 bg-slate-900 rounded border border-slate-700 flex gap-2">
                                <input type="number" id="input-custom-carbs" placeholder="g" class="w-16 bg-slate-800 border border-slate-600 rounded px-1 py-1 text-xs text-white text-center">
                                <button id="btn-log-custom" class="flex-1 bg-emerald-600 text-white rounded px-2 py-1 text-[10px] font-bold">LOG CARBS</button>
                            </div>
                        </div>

                    </div>

                    <div class="bg-slate-900/80 rounded-xl border border-slate-800 p-2 mb-4 shadow-inner">
                        <div id="fuel-history-log" class="space-y-1 max-h-[80px] overflow-y-auto custom-scrollbar text-[10px] text-slate-400"></div>
                    </div>
                </div>

                <div id="fuel-config-view" class="bg-slate-800/80 backdrop-blur rounded-xl p-4 border border-slate-700 mb-6 shadow-2xl">
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
                            <span class="text-[10px] text-slate-500 uppercase font-bold">Solid Food Items</span>
                            <button id="btn-toggle-all-fuel" class="text-[10px] text-blue-400 font-bold px-2 py-1">Toggle All</button>
                        </div>
                        <div id="fuel-library-editor" class="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar mb-3">${FuelComponents.renderFuelEditor(state.fuelMenu)}</div>
                        <div class="pt-3 border-t border-slate-700/50 flex gap-2">
                            <input type="text" id="new-item-name" placeholder="Name" class="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white">
                            <input type="number" id="new-item-carbs" placeholder="g" class="w-16 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white text-center">
                            <button id="btn-add-item" class="bg-emerald-600 text-white rounded px-3 py-1 text-xs font-bold uppercase"><i class="fa-solid fa-plus"></i></button>
                        </div>
                    </div>
                </div>

                <div class="mt-6 flex flex-col gap-3">
                    <button id="btn-fuel-toggle" class="w-full py-4 rounded-xl font-bold text-xl uppercase tracking-widest bg-emerald-600 text-white shadow-xl">Start Engine</button>
                    <button id="btn-fuel-reset" class="hidden w-full py-3 rounded-xl font-bold text-sm uppercase bg-slate-700 text-slate-300">End Session / Configure</button>
                </div>

                <div id="fuel-help-modal" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                     <div class="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl">
                        <h3 class="font-bold text-white uppercase mb-4">Cockpit Manual</h3>
                        <p class="text-xs text-slate-400 mb-6 leading-relaxed">
                            Log sips and squeezes to track inventory. The progress bars show your ride-long fuel and hydration pacer relative to your plan.
                        </p>
                        <button id="btn-dismiss-help" class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-xs uppercase">Dismiss</button>
                     </div>
                </div>
            </div>
        `;
    }
};
