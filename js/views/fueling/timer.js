import { UI } from '../../utils/ui.js';

export const FuelTimer = {
    state: {
        isRunning: false,
        startTime: null,
        totalTime: 0,
        
        // CONFIG
        drinkInterval: 15,
        eatInterval: 45,
        carbsPerBottle: 90, 
        targetHourlyCarbs: 90,
        
        // LIVE TRACKING
        nextDrink: 15 * 60,
        nextEat: 45 * 60,
        totalCarbsConsumed: 0,
        bottlesConsumed: 0,
        
        timerId: null
    },

    beepSound: new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"), 

    init() {
        return `
            <div class="p-4 max-w-5xl mx-auto">
                <div class="grid grid-cols-12 gap-4 mb-6">
                    
                    <div class="col-span-12 md:col-span-4 bg-slate-900 p-5 rounded-xl border border-slate-700 flex flex-col justify-center relative overflow-hidden">
                        <div class="text-xs text-slate-500 uppercase tracking-widest mb-1">Session Duration</div>
                        <div id="fuel-total-time" class="text-5xl font-mono font-bold text-white tracking-tighter z-10">00:00:00</div>
                        
                        <div id="pulse-indicator" class="absolute top-2 right-2 h-3 w-3 rounded-full bg-slate-800"></div>
                    </div>

                    <div class="col-span-6 md:col-span-4 bg-slate-900 p-4 rounded-xl border border-slate-700 flex items-center gap-6">
                        <div class="relative w-16 h-28 mx-auto">
                            <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-3 bg-slate-600 rounded-t-sm"></div>
                            <div class="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-slate-500"></div>
                            
                            <div class="w-full h-full border-4 border-slate-600 rounded-b-xl rounded-t-lg bg-slate-800/50 overflow-hidden relative backdrop-blur-sm">
                                <div id="virtual-bottle-liquid" class="absolute bottom-0 left-0 w-full bg-blue-500/80 transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(59,130,246,0.5)]" style="height: 100%;">
                                    <div class="w-full h-1 bg-blue-400/50 absolute top-0"></div>
                                </div>
                                
                                <div class="absolute top-1/4 left-0 w-3 h-0.5 bg-slate-500/50"></div>
                                <div class="absolute top-2/4 left-0 w-3 h-0.5 bg-slate-500/50"></div>
                                <div class="absolute top-3/4 left-0 w-3 h-0.5 bg-slate-500/50"></div>
                            </div>
                        </div>

                        <div class="flex-1">
                            <div class="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Target Status</div>
                            <div class="text-2xl font-bold text-blue-400 flex items-baseline">
                                <span id="bottle-percent-display">100</span>
                                <span class="text-sm ml-1">%</span>
                            </div>
                            <div class="text-xs text-slate-400 mt-1">Full</div>
                            <div class="text-[10px] text-slate-600 mt-2">Bottle #<span id="target-bottle-count">1</span></div>
                        </div>
                    </div>

                    <div class="col-span-6 md:col-span-4 bg-slate-900 p-4 rounded-xl border border-slate-700 relative overflow-hidden flex flex-col justify-center">
                        <div class="relative z-10">
                            <div class="text-xs text-slate-500 uppercase tracking-widest mb-1">Total Intake</div>
                            <div class="flex items-baseline gap-2">
                                <span id="fuel-consumed-display" class="text-4xl font-bold text-emerald-400">0</span>
                                <span class="text-sm text-slate-400">g</span>
                            </div>
                            <div id="fuel-target-display" class="text-xs text-slate-500 mt-1">Target: 0g</div>
                        </div>
                        <div id="fuel-gauge-fill" class="absolute bottom-0 left-0 w-full h-1 bg-emerald-500/20 transition-all duration-1000"></div>
                    </div>
                </div>

                <div id="fuel-active-view" class="hidden grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    
                    <div id="card-drink" class="relative overflow-hidden bg-slate-800 border-2 border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-300">
                        <div class="absolute top-4 right-4 text-blue-500/50 text-6xl opacity-20"><i class="fa-solid fa-bottle-water"></i></div>
                        
                        <div class="text-blue-400 text-sm uppercase font-bold tracking-widest mb-1">Drink Timer</div>
                        <div id="timer-drink" class="text-8xl font-mono font-bold text-white mb-6 tracking-tighter">15:00</div>
                        
                        <button id="btn-log-sip" class="w-full bg-slate-700 hover:bg-blue-600 hover:text-white text-blue-200 py-3 rounded-lg font-bold text-sm uppercase tracking-widest transition-colors flex items-center justify-center gap-2 group">
                            <i class="fa-solid fa-glass-water"></i> Log Sip
                        </button>
                    </div>

                    <div id="card-eat" class="relative overflow-hidden bg-slate-800 border-2 border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-300">
                        <div class="absolute top-4 right-4 text-orange-500/50 text-6xl opacity-20"><i class="fa-solid fa-burger"></i></div>
                        
                        <div class="text-orange-400 text-sm uppercase font-bold tracking-widest mb-1">Eat Timer</div>
                        <div id="timer-eat" class="text-8xl font-mono font-bold text-white mb-6 tracking-tighter">45:00</div>
                        
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
                            <label class="block text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">Bottle Mix (Carbs g)</label>
                            <input type="number" id="input-bottle-carbs" value="90" class="w-full bg-slate-800 text-white border border-blue-500/50 rounded p-2 text-xl font-mono focus:border-blue-400 outline-none">
                        </div>
                    </div>
                    
                    <div class="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 mb-6">
                         <label class="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Target Intake (g/hr)</label>
                         <input type="number" id="input-target-hourly" value="90" class="w-full bg-slate-800 text-white border border-slate-600 rounded p-2 text-xl font-mono focus:border-emerald-500 outline-none">
                         <div class="text-[10px] text-slate-500 mt-1">Controls how fast the virtual bottle empties.</div>
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
        const drinkInput = parseInt(document.getElementById('input-drink-int').value) || 15;
        const eatInput = parseInt(document.getElementById('input-eat-int').value) || 45;
        const carbsInput = parseInt(document.getElementById('input-bottle-carbs').value) || 90;
        const targetHourly = parseInt(document.getElementById('input-target-hourly').value) || 90;

        this.state.drinkInterval = drinkInput;
        this.state.eatInterval = eatInput;
        this.state.carbsPerBottle = carbsInput;
        this.state.targetHourlyCarbs = targetHourly;
        
        if (this.state.totalTime === 0) {
            this.state.nextDrink = drinkInput * 60;
            this.state.nextEat = eatInput * 60;
        }

        document.getElementById('fuel-config-view').classList.add('hidden');
        document.getElementById('fuel-active-view').classList.remove('hidden');
        document.getElementById('btn-fuel-reset').classList.remove('hidden');
        
        const btn = document.getElementById('btn-fuel-toggle');
        btn.innerText = "Pause";
        btn.className = "col-span-2 md:col-span-1 py-4 rounded-xl font-bold text-xl uppercase tracking-widest transition-all bg-yellow-600 hover:bg-yellow-500 text-white";

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
        btn.className = "col-span-2 md:col-span-1 py-4 rounded-xl font-bold text-xl uppercase tracking-widest transition-all bg-emerald-600 hover:bg-emerald-500 text-white";
        
        const pulse = document.getElementById('pulse-indicator');
        if(pulse) pulse.classList.remove('animate-pulse', 'bg-emerald-500');
    },

    resetTimer() {
        this.pauseTimer();
        this.state.totalTime = 0;
        this.state.totalCarbsConsumed = 0;
        this.state.bottlesConsumed = 0;
        
        document.getElementById('fuel-total-time').innerText = "00:00:00";
        document.getElementById('timer-drink').innerText = "--:--";
        document.getElementById('timer-eat').innerText = "--:--";
        
        // Reset Bottle Visuals
        const liquid = document.getElementById('virtual-bottle-liquid');
        if(liquid) liquid.style.height = '100%';
        document.getElementById('bottle-percent-display').innerText = "100";
        document.getElementById('target-bottle-count').innerText = "1";

        this.updateGauge();

        document.getElementById('fuel-config-view').classList.remove('hidden');
        document.getElementById('fuel-active-view').classList.add('hidden');
        document.getElementById('btn-fuel-reset').classList.add('hidden');

        const btn = document.getElementById('btn-fuel-toggle');
        btn.innerText = "Start Engine";
        btn.className = "col-span-2 md:col-span-1 py-4 rounded-xl font-bold text-xl uppercase tracking-widest transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20";
    },

    logSip() {
        // Assume 4 sips per bottle (rough standard)
        const sipsPerBottle = 4; 
        const carbsPerSip = this.state.carbsPerBottle / sipsPerBottle;
        
        this.state.totalCarbsConsumed += carbsPerSip;
        this.state.bottlesConsumed += (1 / sipsPerBottle);
        
        this.updateGauge();
        
        this.state.nextDrink = this.state.drinkInterval * 60;
        this.updateCard('drink', this.state.nextDrink, this.state.drinkInterval);
    },

    tick() {
        this.state.totalTime++;
        this.state.nextDrink--;
        this.state.nextEat--;

        document.getElementById('fuel-total-time').innerText = this.formatTime(this.state.totalTime);

        this.updateCard('drink', this.state.nextDrink, this.state.drinkInterval);
        this.updateCard('eat', this.state.nextEat, this.state.eatInterval);
        
        this.updatePacerBottle(); // Update the visual bottle
    },

    updatePacerBottle() {
        // 1. Calculate how many bottles *should* have been consumed by now
        // Formula: (Total Hours) * (Target Carbs per Hour / Carbs per Bottle)
        const hoursPassed = this.state.totalTime / 3600;
        const bottlesPerHour = this.state.targetHourlyCarbs / this.state.carbsPerBottle;
        const targetBottlesTotal = hoursPassed * bottlesPerHour;

        // 2. Determine current bottle fraction
        // e.g. targetBottlesTotal = 1.25 -> We are on bottle 2, and 0.25 (25%) of it should be gone.
        // We want % Remaining, so 1.0 - 0.25 = 0.75 (75% Full).
        let fractionConsumed = targetBottlesTotal % 1;
        let percentRemaining = (1 - fractionConsumed) * 100;
        let currentBottleNumber = Math.floor(targetBottlesTotal) + 1;

        // Visual Updates
        const liquid = document.getElementById('virtual-bottle-liquid');
        const percentText = document.getElementById('bottle-percent-display');
        const bottleCountText = document.getElementById('target-bottle-count');
        const fuelTargetText = document.getElementById('fuel-target-display');

        if(liquid) liquid.style.height = `${percentRemaining}%`;
        if(percentText) percentText.innerText = Math.round(percentRemaining);
        if(bottleCountText) bottleCountText.innerText = currentBottleNumber;

        // Also update text target tracker
        const expectedCarbs = hoursPassed * this.state.targetHourlyCarbs;
        if(fuelTargetText) fuelTargetText.innerText = `Target: ${Math.round(expectedCarbs)}g`;
    },

    updateGauge() {
        document.getElementById('fuel-consumed-display').innerText = Math.round(this.state.totalCarbsConsumed);
        const percentage = Math.min((this.state.totalCarbsConsumed / 200) * 100, 100);
        const gauge = document.getElementById('fuel-gauge-fill');
        if(gauge) gauge.style.width = `${percentage}%`;
    },

    updateCard(type, secondsLeft, intervalMins) {
        const timerEl = document.getElementById(`timer-${type}`);
        const cardEl = document.getElementById(type === 'drink' ? 'card-drink' : 'card-eat');

        if (secondsLeft <= 0) {
            timerEl.innerText = "NOW!";
            if (Math.abs(secondsLeft) % 2 === 0) {
                cardEl.classList.add(type === 'drink' ? 'border-blue-500' : 'border-orange-500');
                cardEl.classList.add('bg-slate-700');
            } else {
                cardEl.classList.remove(type === 'drink' ? 'border-blue-500' : 'border-orange-500');
                cardEl.classList.remove('bg-slate-700');
            }
            if (secondsLeft < -30) {
                 this.state[type === 'drink' ? 'nextDrink' : 'nextEat'] = intervalMins * 60;
                 cardEl.className = "relative overflow-hidden bg-slate-800 border-2 border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-300";
            }
        } else {
            timerEl.innerText = this.formatTime(secondsLeft);
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
