import { UI } from '../../utils/ui.js';
import { DataManager } from '../../utils/data.js';

export const FuelTimer = {
    state: {
        isRunning: false,
        startTime: null,
        totalTime: 0,
        
        // Configuration Defaults
        drinkInterval: 15,
        eatInterval: 45,
        carbsPerBottle: 90, 
        targetHourlyCarbs: 90,
        
        // Data
        fuelMenu: [],

        // Counters
        nextDrink: 15 * 60,
        nextEat: 45 * 60,
        totalCarbsConsumed: 0,
        bottlesConsumed: 0,
        
        timerId: null
    },

    // beepSound: new Audio("..."), // Optional: Add sound if needed

    async init() {
        // 1. Load your preset menu from the JSON file
        let library = await DataManager.fetchJSON('fuelLibrary');
        
        // 2. Safety Fallback if file is missing
        if (!library || library.length === 0) {
            console.warn("Fuel Library not found, using defaults.");
            library = [
                { id: 'gel', label: 'Gel', carbs: 22, icon: 'fa-bolt' },
                { id: 'chews', label: 'Chews', carbs: 24, icon: 'fa-candy-cane' },
                { id: 'bar', label: 'Bar', carbs: 40, icon: 'fa-cookie-bite' }
            ];
        }
        
        // 3. Normalize Data: Ensure every item has an 'active' property (default to true)
        this.state.fuelMenu = library.map(item => ({
            ...item,
            active: item.active !== false // Shows by default unless explicitly false
        }));

        // 4. Return the View
        return this.getHtml();
    },
    getHtml() {
        return `
            <div class="p-4 max-w-5xl mx-auto pb-24">
                
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

                    <div class="col-span-6 md:col-span-4 bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col justify-center">
                        <div class="text-xs text-slate-500 uppercase tracking-widest mb-1">Total Carbs</div>
                        <div class="flex items-baseline gap-2">
                            <span id="fuel-consumed-display" class="text-4xl font-bold text-emerald-400">0</span>
                            <span class="text-sm text-slate-400">g</span>
                        </div>
                        <div id="fuel-target-display" class="text-xs text-slate-500 mt-1">Target: 0g</div>
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
                            
                            <div class="w-full max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                                <div class="grid grid-cols-2 gap-2" id="fuel-menu-container">
                                    ${this.renderFuelButtons()}
                                </div>
                            </div>
                            
                            <div class="w-full mt-3 pt-3 border-t border-slate-700/50">
                                <div class="flex gap-2">
                                    <input type="number" id="input-custom-carbs" placeholder="Custom g" class="w-24 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-center text-white">
                                    <button id="btn-log-custom" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded px-2 py-1 text-xs font-bold">ADD</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="fuel-config-view" class="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 class="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2">Mission Control</h3>
                    
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label class="block text-[10px] text-slate-400 uppercase font-bold mb-1">Drink (min)</label>
                            <input type="number" id="input-drink-int" value="15" class="w-full bg-slate-900 border-slate-600 rounded p-2 text-white">
                        </div>
                        <div>
                            <label class="block text-[10px] text-slate-400 uppercase font-bold mb-1">Eat (min)</label>
                            <input type="number" id="input-eat-int" value="45" class="w-full bg-slate-900 border-slate-600 rounded p-2 text-white">
                        </div>
                        <div>
                            <label class="block text-[10px] text-blue-400 uppercase font-bold mb-1">Bottle (g)</label>
                            <input type="number" id="input-bottle-carbs" value="90" class="w-full bg-slate-900 border-slate-600 rounded p-2 text-white">
                        </div>
                        <div>
                            <label class="block text-[10px] text-emerald-400 uppercase font-bold mb-1">Target (g/hr)</label>
                            <input type="number" id="input-target-hourly" value="90" class="w-full bg-slate-900 border-slate-600 rounded p-2 text-white">
                        </div>
                    </div>

                    <div class="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <div class="text-[10px] text-slate-500 uppercase font-bold mb-2">Active Menu Items</div>
                        <div id="fuel-library-editor" class="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                            ${this.renderFuelEditor()}
                        </div>
                    </div>
                </div>

                <div class="mt-6 grid grid-cols-1 gap-3">
                    <button id="btn-fuel-toggle" class="w-full py-4 rounded-xl font-bold text-xl uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg">
                        Start Engine
                    </button>
                    <button id="btn-fuel-reset" class="hidden w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest bg-slate-700 hover:bg-slate-600 text-slate-300">
                        Reset / Configure
                    </button>
                </div>
            </div>
        `;
    },
    // --- RENDERING HELPERS ---
    
    renderFuelButtons() {
        const activeItems = this.state.fuelMenu.filter(i => i.active);
        if (activeItems.length === 0) return '<div class="col-span-2 text-xs text-slate-500 italic p-2 text-center">No active items. Enable them below.</div>';
        
        return activeItems.map(item => `
            <button class="btn-quick-fuel bg-slate-700 hover:bg-orange-600 hover:text-white text-slate-200 py-2 rounded-lg text-xs font-bold uppercase transition-colors flex flex-col items-center justify-center h-14 border border-slate-600"
                data-carbs="${item.carbs}">
                <i class="fa-solid ${item.icon} mb-1 opacity-70"></i>
                <span>${item.label} (${item.carbs})</span>
            </button>
        `).join('');
    },

    renderFuelEditor() {
        return this.state.fuelMenu.map((item, index) => `
            <div class="flex gap-2 items-center bg-slate-800 p-2 rounded border border-slate-700">
                <button class="btn-toggle-active w-8 h-8 flex items-center justify-center rounded ${item.active ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-600 bg-slate-900'}" data-index="${index}">
                    <i class="fa-solid ${item.active ? 'fa-eye' : 'fa-eye-slash'}"></i>
                </button>
                <div class="w-6 text-center text-slate-500"><i class="fa-solid ${item.icon}"></i></div>
                <div class="flex-1 text-sm text-white">${item.label}</div>
                <div class="text-xs text-slate-400">${item.carbs}g</div>
            </div>
        `).join('');
    },

    // --- EVENT HANDLERS ---

    attachEvents() {
        // Main Buttons
        this.bindClick('btn-fuel-toggle', () => this.toggleTimer());
        this.bindClick('btn-fuel-reset', () => this.resetTimer());
        this.bindClick('btn-log-sip', () => this.logSip());
        
        // Custom Input
        this.bindClick('btn-log-custom', () => {
            const input = document.getElementById('input-custom-carbs');
            const val = parseInt(input.value) || 0;
            if(val > 0) { this.logFood(val); input.value = ''; }
        });

        // Quick Menu (Delegation)
        const menuContainer = document.getElementById('fuel-menu-container');
        if(menuContainer) {
            menuContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-quick-fuel');
                if (btn) this.logFood(parseInt(btn.dataset.carbs));
            });
        }

        // Editor Toggles
        const editorContainer = document.getElementById('fuel-library-editor');
        if(editorContainer) {
            editorContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-toggle-active');
                if (btn) {
                    const idx = btn.dataset.index;
                    this.state.fuelMenu[idx].active = !this.state.fuelMenu[idx].active;
                    this.refreshUI(); 
                }
            });
        }
    },

    bindClick(id, handler) {
        const el = document.getElementById(id);
        if(el) el.addEventListener('click', handler);
    },

    refreshUI() {
        const menu = document.getElementById('fuel-menu-container');
        const editor = document.getElementById('fuel-library-editor');
        if(menu) menu.innerHTML = this.renderFuelButtons();
        if(editor) editor.innerHTML = this.renderFuelEditor();
    },

    // --- CORE LOGIC ---

    toggleTimer() {
        if (this.state.isRunning) this.pauseTimer();
        else this.startTimer();
    },

    startTimer() {
        // Read Inputs
        this.state.drinkInterval = parseInt(document.getElementById('input-drink-int').value) || 15;
        this.state.eatInterval = parseInt(document.getElementById('input-eat-int').value) || 45;
        this.state.carbsPerBottle = parseInt(document.getElementById('input-bottle-carbs').value) || 90;
        this.state.targetHourlyCarbs = parseInt(document.getElementById('input-target-hourly').value) || 90;

        // Init counters if fresh start
        if (this.state.totalTime === 0) {
            this.state.nextDrink = this.state.drinkInterval * 60;
            this.state.nextEat = this.state.eatInterval * 60;
        }

        // Switch UI
        document.getElementById('fuel-config-view').classList.add('hidden');
        document.getElementById('fuel-active-view').classList.remove('hidden');
        document.getElementById('btn-fuel-reset').classList.remove('hidden');
        
        const btn = document.getElementById('btn-fuel-toggle');
        btn.innerText = "Pause";
        btn.className = "w-full py-4 rounded-xl font-bold text-xl uppercase tracking-widest bg-yellow-600 hover:bg-yellow-500 text-white";

        const pulse = document.getElementById('pulse-indicator');
        if(pulse) pulse.classList.add('animate-pulse', 'bg-emerald-500');

        this.state.isRunning = true;
        this.state.timerId = setInterval(() => this.tick(), 1000);
    },

    pauseTimer() {
        this.state.isRunning = false;
        clearInterval(this.state.timerId);
        
        const btn = document.getElementById('btn-fuel-toggle');
        btn.innerText = "Resume";
        btn.className = "w-full py-4 rounded-xl font-bold text-xl uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white";
        
        const pulse = document.getElementById('pulse-indicator');
        if(pulse) pulse.classList.remove('animate-pulse', 'bg-emerald-500');
    },

    resetTimer() {
        this.pauseTimer();
        this.state.totalTime = 0;
        this.state.totalCarbsConsumed = 0;
        this.state.bottlesConsumed = 0;
        
        // Reset Displays
        document.getElementById('fuel-total-time').innerText = "00:00:00";
        document.getElementById('timer-drink').innerText = "--:--";
        document.getElementById('timer-eat').innerText = "--:--";
        this.updatePacerBottle(true); // reset bottle
        this.updateGauge();

        // Switch View Back
        document.getElementById('fuel-config-view').classList.remove('hidden');
        document.getElementById('fuel-active-view').classList.add('hidden');
        document.getElementById('btn-fuel-reset').classList.add('hidden');

        const btn = document.getElementById('btn-fuel-toggle');
        btn.innerText = "Start Engine";
        btn.className = "w-full py-4 rounded-xl font-bold text-xl uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg";
    },

    logSip() {
        const sips = 4; // Approx sips per bottle
        const amount = this.state.carbsPerBottle / sips;
        this.state.totalCarbsConsumed += amount;
        this.state.bottlesConsumed += (1 / sips);
        
        this.updateGauge();
        // Reset Drink Timer
        this.state.nextDrink = this.state.drinkInterval * 60;
        this.updateCard('drink', this.state.nextDrink, this.state.drinkInterval);
    },

    logFood(carbs) {
        this.state.totalCarbsConsumed += carbs;
        this.updateGauge();
        // Reset Eat Timer
        this.state.nextEat = this.state.eatInterval * 60;
        this.updateCard('eat', this.state.nextEat, this.state.eatInterval);
    },

    tick() {
        this.state.totalTime++;
        this.state.nextDrink--;
        this.state.nextEat--;

        document.getElementById('fuel-total-time').innerText = this.formatTime(this.state.totalTime);
        this.updateCard('drink', this.state.nextDrink, this.state.drinkInterval);
        this.updateCard('eat', this.state.nextEat, this.state.eatInterval);
        this.updatePacerBottle();
    },

    updatePacerBottle(reset = false) {
        const liquid = document.getElementById('virtual-bottle-liquid');
        if(reset) { if(liquid) liquid.style.height = '100%'; return; }

        const hoursPassed = this.state.totalTime / 3600;
        const bottlesPerHour = this.state.targetHourlyCarbs / this.state.carbsPerBottle;
        const totalBottlesTarget = hoursPassed * bottlesPerHour;

        const percentRemaining = (1 - (totalBottlesTarget % 1)) * 100;
        const currentBottle = Math.floor(totalBottlesTarget) + 1;

        if(liquid) liquid.style.height = `${percentRemaining}%`;
        document.getElementById('bottle-percent-display').innerText = Math.round(percentRemaining);
        document.getElementById('target-bottle-count').innerText = currentBottle;
        
        const targetTotal = Math.round(hoursPassed * this.state.targetHourlyCarbs);
        document.getElementById('fuel-target-display').innerText = `Target: ${targetTotal}g`;
    },

    updateGauge() {
        document.getElementById('fuel-consumed-display').innerText = Math.round(this.state.totalCarbsConsumed);
        // Visual cap for bar graph (e.g. 300g max width)
        const pct = Math.min((this.state.totalCarbsConsumed / 300) * 100, 100);
        const gauge = document.getElementById('fuel-gauge-fill');
        if(gauge) gauge.style.width = `${pct}%`;
    },

    updateCard(type, seconds, interval) {
        const timerEl = document.getElementById(`timer-${type}`);
        const cardEl = document.getElementById(type === 'drink' ? 'card-drink' : 'card-eat');
        
        if (seconds <= 0) {
            timerEl.innerText = "NOW!";
            // Flash Effect
            const isEven = Math.abs(seconds) % 2 === 0;
            const border = type === 'drink' ? 'border-blue-500' : 'border-orange-500';
            
            if(isEven) {
                cardEl.classList.add(border, 'bg-slate-700');
            } else {
                cardEl.classList.remove(border, 'bg-slate-700');
            }
            
            // Auto Reset (60s)
            if (seconds < -60) {
                this.state[type === 'drink' ? 'nextDrink' : 'nextEat'] = interval * 60;
                cardEl.className = "bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center";
            }
        } else {
            timerEl.innerText = this.formatTime(seconds);
            cardEl.className = "bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center";
        }
    },

    formatTime(s) {
        const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
        const pad = (n) => String(n).padStart(2,'0');
        if(h>0) return `${h}:${pad(m)}:${pad(sec)}`;
        return `${pad(m)}:${pad(sec)}`;
    }
};
