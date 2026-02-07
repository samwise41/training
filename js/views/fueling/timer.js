import { UI } from '../../utils/ui.js';

export const FuelTimer = {
    state: {
        isRunning: false,
        startTime: null,
        totalTime: 0,
        
        // CONFIG
        drinkInterval: 15,
        eatInterval: 45,
        carbsPerBottle: 90, // <--- NEW: Your "Standard" mix
        targetHourlyCarbs: 90,
        
        // LIVE TRACKING
        nextDrink: 15 * 60,
        nextEat: 45 * 60,
        totalCarbsConsumed: 0,
        bottlesConsumed: 0,
        
        timerId: null
    },

    // Simple beep (Base64)
    beepSound: new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"), 

    init() {
        return `
            <div class="p-4 max-w-5xl mx-auto">
                <div class="grid grid-cols-12 gap-4 mb-6">
                    <div class="col-span-8 md:col-span-4 bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col justify-center">
                        <div class="text-xs text-slate-500 uppercase tracking-widest mb-1">Session Duration</div>
                        <div id="fuel-total-time" class="text-5xl font-mono font-bold text-white tracking-tighter">00:00:00</div>
                    </div>

                    <div class="col-span-4 md:col-span-4 bg-slate-900 p-4 rounded-xl border border-slate-700 relative overflow-hidden">
                        <div class="relative z-10">
                            <div class="text-xs text-slate-500 uppercase tracking-widest mb-1">Fuel On Board</div>
                            <div class="flex items-baseline gap-2">
                                <span id="fuel-consumed-display" class="text-4xl font-bold text-emerald-400">0</span>
                                <span class="text-sm text-slate-400">g carbs</span>
                            </div>
                            <div id="fuel-target-display" class="text-xs text-slate-500 mt-1">Target: 0g by now</div>
                        </div>
                        <div id="fuel-gauge-fill" class="absolute bottom-0 left-0 w-full h-1 bg-emerald-500/20 transition-all duration-1000"></div>
                    </div>

                    <div class="col-span-12 md:col-span-4 bg-slate-900 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                        <div>
                            <div class="text-xs text-slate-500 uppercase tracking-widest mb-1">Bottles</div>
                            <div class="text-3xl font-bold text-blue-400"><span id="bottle-count">0.0</span> <span class="text-sm text-slate-500">consumed</span></div>
                        </div>
                        <div class="h-12 w-12 rounded-full border-4 border-blue-500/30 flex items-center justify-center">
                            <i class="fa-solid fa-bottle-water text-blue-400"></i>
                        </div>
                    </div>
                </div>

                <div id="fuel-active-view" class="hidden grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    
                    <div id="card-drink" class="relative overflow-hidden bg-slate-800 border-2 border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-300">
                        <div class="absolute top-4 right-4 text-blue-500/50 text-6xl opacity-20"><i class="fa-solid fa-bottle-water"></i></div>
                        
                        <div class="text-blue-400 text-sm uppercase font-bold tracking-widest mb-1">Hydration Alert</div>
                        <div id="timer-drink" class="text-8xl font-mono font-bold text-white mb-4 tracking-tighter">15:00</div>
                        
                        <div class="w-full bg-slate-700/50 rounded-full h-12 flex items-center relative overflow-hidden cursor-pointer hover:bg-slate-700 transition-colors group" id="btn-log-sip">
                            <div class="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-300 uppercase tracking-widest z-10 group-hover:text-white">
                                Log Sip (~20g)
                            </div>
                            <div class="h-full bg-blue-500/20 w-0 transition-all duration-300"></div>
                        </div>
                    </div>

                    <div id="card-eat" class="relative overflow-hidden bg-slate-800 border-2 border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-300">
                        <div class="absolute top-4 right-4 text-orange-500/50 text-6xl opacity-20"><i class="fa-solid fa-burger"></i></div>
                        
                        <div class="text-orange-400 text-sm uppercase font-bold tracking-widest mb-1">Solid Fuel</div>
                        <div id="timer-eat" class="text-8xl font-mono font-bold text-white mb-4 tracking-tighter">45:00</div>
                        
                        <div class="text-center text-xs text-slate-500">Next: Gel / Chew</div>
                    </div>
                </div>

                <div id="fuel-config-view" class="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <div class="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                        <h3 class="text-lg font-bold text-white"><i class="fa-solid fa-sliders mr-2"></i> Mission Parameters</h3>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div class="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                            <label class="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Drink Every (min)</label>
                            <input type="number" id="input-drink-int" value="15" class="w-full bg-slate-800 text-white border border-slate-600 rounded p-2 text-xl font-mono focus:border-blue-500 outline-none">
                        </div>
                        <div class="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                            <label class="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Eat Every (min)</label>
                            <input type="number" id="input-eat-int" value="45" class="w-full bg-slate-800 text-white border border-slate-600 rounded p-2 text-xl font-mono focus:border-orange-500 outline-none">
                        </div>

                        <div class="bg-blue-900/10 p-4 rounded-lg border border-blue-500/30">
                            <label class="block text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Carbs Per Bottle (g)</label>
                            <input type="number" id="input-bottle-carbs" value="90" class="w-full bg-slate-800 text-white border border-blue-500/50 rounded p-2 text-xl font-mono focus:border-blue-400 outline-none">
                            <div class="mt-2 text-[10px] text-slate-500">
                                *Used to calculate intake. Assumes ~4 sips per bottle.
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mt-6">
                    <button id="btn-fuel-toggle" class="col-span-2 md:col-span-1 py-4 rounded-xl font-bold text-xl uppercase tracking-widest transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20">
                        Start Engine
                    </button>
                    <button id="btn-fuel-reset" class="col-span-2 md:col-span-1 py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all bg-slate-700 hover:bg-slate-600 text-slate-300 hidden">
                        Reset System
                    </button>
                </div>
            </div>
        `;
    },

    attachEvents() {
        const toggleBtn = document.getElementById('btn-fuel-toggle');
        const resetBtn = document.getElementById('btn-fuel-reset');
        const logSipBtn = document.getElementById('btn-log-sip');
        
        if(toggleBtn) toggleBtn.addEventListener('click', () => this.toggleTimer());
        if(resetBtn) resetBtn.addEventListener('click', () => this.resetTimer());
        if(logSipBtn) logSipBtn.addEventListener('click', () => this.logSip());
    },

    toggleTimer() {
        if (this.state.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    },

    startTimer() {
        // Read Config
        const drinkInput = parseInt(document.getElementById('input-drink-int').value) || 15;
        const eatInput = parseInt(document.getElementById('input-eat-int').value) || 45;
        const carbsInput = parseInt(document.getElementById('input-bottle-carbs').value) || 90;

        // Update State
        this.state.drinkInterval = drinkInput;
        this.state.eatInterval = eatInput;
        this.state.carbsPerBottle = carbsInput;
        
        // Initial Counters (in seconds)
        if (this.state.totalTime === 0) {
            this.state.nextDrink = drinkInput * 60;
            this.state.nextEat = eatInput * 60;
        }

        // UI Updates
        document.getElementById('fuel-config-view').classList.add('hidden');
        document.getElementById('fuel-active-view').classList.remove('hidden');
        document.getElementById('btn-fuel-reset').classList.remove('hidden');
        
        const btn = document.getElementById('btn-fuel-toggle');
        btn.innerText = "Pause";
        btn.className = "col-span-2 md:col-span-1 py-4 rounded-xl font-bold text-xl uppercase tracking-widest transition-all bg-yellow-600 hover:bg-yellow-500 text-white";

        this.state.isRunning = true;
        this.state.timerId = setInterval(() => this.tick(), 1000);
    },

    pauseTimer() {
        this.state.isRunning = false;
        clearInterval(this.state.timerId);
        
        const btn = document.getElementById('btn-fuel-toggle');
        btn.innerText = "Resume";
        btn.className = "col-span-2 md:col-span-1 py-4 rounded-xl font-bold text-xl uppercase tracking-widest transition-all bg-emerald-600 hover:bg-emerald-500 text-white";
    },

    resetTimer() {
        this.pauseTimer();
        this.state.totalTime = 0;
        this.state.totalCarbsConsumed = 0;
        this.state.bottlesConsumed = 0;
        
        document.getElementById('fuel-total-time').innerText = "00:00:00";
        document.getElementById('timer-drink').innerText = "--:--";
        document.getElementById('timer-eat').innerText = "--:--";
        
        this.updateGauge(); // Reset Gauge

        document.getElementById('fuel-config-view').classList.remove('hidden');
        document.getElementById('fuel-active-view').classList.add('hidden');
        document.getElementById('btn-fuel-reset').classList.add('hidden');

        const btn = document.getElementById('btn-fuel-toggle');
        btn.innerText = "Start Engine";
        btn.className = "col-span-2 md:col-span-1 py-4 rounded-xl font-bold text-xl uppercase tracking-widest transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20";
    },

    logSip() {
        // Assume 1 "Sip" is 1/4 of a bottle (standard interval logic)
        // If drinking every 15 min, you drink a bottle per hour = 4 sips.
        const sipsPerBottle = 4; 
        const carbsPerSip = this.state.carbsPerBottle / sipsPerBottle;
        
        this.state.totalCarbsConsumed += carbsPerSip;
        this.state.bottlesConsumed += (1 / sipsPerBottle);
        
        this.updateGauge();
        
        // Reset the drink timer instantly when they log it
        this.state.nextDrink = this.state.drinkInterval * 60;
        this.updateCard('drink', this.state.nextDrink, this.state.drinkInterval);
    },

    tick() {
        this.state.totalTime++;
        this.state.nextDrink--;
        this.state.nextEat--;

        // Update Total Time
        document.getElementById('fuel-total-time').innerText = this.formatTime(this.state.totalTime);

        // Update Drink Timer
        this.updateCard('drink', this.state.nextDrink, this.state.drinkInterval);
        
        // Update Eat Timer
        this.updateCard('eat', this.state.nextEat, this.state.eatInterval);
        
        // Update Target (Linear accumulation)
        // e.g., if target is 90g/hr, that is 1.5g per minute
        const expectedCarbs = (this.state.totalTime / 60) * (this.state.targetHourlyCarbs / 60);
        document.getElementById('fuel-target-display').innerText = `Target: ${Math.round(expectedCarbs)}g by now`;
    },

    updateGauge() {
        document.getElementById('fuel-consumed-display').innerText = Math.round(this.state.totalCarbsConsumed);
        document.getElementById('bottle-count').innerText = this.state.bottlesConsumed.toFixed(1);
        
        // Fill height calc (max 200g visual limit for gauge scaling)
        const percentage = Math.min((this.state.totalCarbsConsumed / 200) * 100, 100);
        const gauge = document.getElementById('fuel-gauge-fill');
        if(gauge) {
            gauge.style.height = `${percentage}%`; // Vertical fill or
            gauge.style.width = `${percentage}%`;  // Horizontal fill (used width in HTML)
        }
    },

    updateCard(type, secondsLeft, intervalMins) {
        const timerEl = document.getElementById(`timer-${type}`);
        const cardEl = document.getElementById(type === 'drink' ? 'card-drink' : 'card-eat');

        // ALERT LOGIC
        if (secondsLeft <= 0) {
            // Flash Mode
            timerEl.innerText = "NOW!";
            
            if (Math.abs(secondsLeft) % 2 === 0) {
                cardEl.classList.add(type === 'drink' ? 'border-blue-500' : 'border-orange-500');
                cardEl.classList.add('bg-slate-700');
            } else {
                cardEl.classList.remove(type === 'drink' ? 'border-blue-500' : 'border-orange-500');
                cardEl.classList.remove('bg-slate-700');
            }

            // Auto Reset after 30 seconds if ignored (safety fallback)
            if (secondsLeft < -30) {
                 this.state[type === 'drink' ? 'nextDrink' : 'nextEat'] = intervalMins * 60;
                 // Reset visuals
                 cardEl.className = "relative overflow-hidden bg-slate-800 border-2 border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-300";
            }

        } else {
            // Normal Count Down
            timerEl.innerText = this.formatTime(secondsLeft);
            // Reset borders if they were flashing
            cardEl.className = `relative overflow-hidden bg-slate-800 border-2 border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-300`;
        }
    },

    formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        
        if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
};
