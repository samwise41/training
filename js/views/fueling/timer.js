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
        
        // FUEL LIBRARY (Defaults)
        fuelMenu: [
            { id: 'gel', label: 'Gel', carbs: 22, icon: 'fa-bolt' },
            { id: 'chews', label: 'Chews', carbs: 24, icon: 'fa-candy-cane' },
            { id: 'bar', label: 'Bar', carbs: 40, icon: 'fa-cookie-bite' },
            { id: 'banana', label: 'Banana', carbs: 27, icon: 'fa-carrot' }
        ],

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
            <div class="p-4 max-w-5xl mx-auto pb-20"> <div class="grid grid-cols-12 gap-4 mb-6">
                    
                    <div class="col-span-12 md:col-span-4 bg-slate-900 p-5 rounded-xl border border-slate-700 flex flex-col justify-center relative overflow-hidden">
                        <div class="text-xs text-slate-500 uppercase tracking-widest mb-1">Session Duration</div>
                        <div id="fuel-total-time" class="text-5xl font-mono font-bold text-white tracking-tighter z-10">00:00:00</div>
                        <div id="pulse-indicator" class="absolute top-2 right-2 h-3 w-3 rounded-full bg-slate-800"></div>
                    </div>

                    <div class="col-span-6 md:col-span-4 bg-slate-900 p-4 rounded-xl border border-slate-700 flex items-center gap-6">
                        <div class="relative w-14 h-24 mx-auto">
                            <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-3 bg-slate-600 rounded-t-sm"></div>
                            <div class="w-full h-full border-4 border-slate-600 rounded-b-xl rounded-t-lg bg-slate-800/50 overflow-hidden relative backdrop-blur-sm">
                                <div id="virtual-bottle-liquid" class="absolute bottom-0 left-0 w-full bg-blue-500/80 transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(59,130,246,0.5)]" style="height: 100%;">
                                    <div class="w-full h-1 bg-blue-400/50 absolute top-0"></div>
                                </div>
                            </div>
                        </div>
                        <div class="flex-1">
                            <div class="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Target Pacer</div>
                            <div class="text-2xl font-bold text-blue-400 flex items-baseline">
                                <span id="bottle-percent-display">100</span><span class="text-sm ml-1">%</span>
                            </div>
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

                <div id="fuel-active-view" class="hidden">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        
                        <div id="card-drink" class="bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-300">
                            <div class="text-blue-400 text-xs uppercase font-bold tracking-widest mb-1">Hydration</div>
                            <div id="timer-drink" class="text-7xl font-mono font-bold text-white mb-4 tracking-tighter">15:00</div>
                            <button id="btn-log-sip" class="w-full bg-slate-700 hover:bg-blue-600 hover:text-white text-blue-200 py-3 rounded-lg font-bold text-sm uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                                <i class="fa-solid fa-glass-water"></i> Log Sip
                            </button>
                        </div>

                        <div id="card-eat" class="bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-300">
                            <div class="text-orange-400 text-xs uppercase font-bold tracking-widest mb-1">Fueling</div>
                            <div id="timer-eat" class="text-7xl font-mono font-bold text-white mb-4 tracking-tighter">45:00</div>
                            <div class="text-center text-xs text-slate-500 mb-2">Select Item to Log & Reset:</div>
                            
                            <div class="grid grid-cols-2 gap-2 w-full" id="fuel-menu-container">
                                ${this.renderFuelButtons()}
                            </div>
                            
                            <button id="btn-show-custom-fuel" class="text-[10px] text-slate-500 mt-3 underline hover:text-slate-300">
                                Log Custom Amount
                            </button>
                            
                            <div id="custom-fuel-input-area" class="hidden w-full mt-2 flex gap-2">
                                <input type="number" id="input-custom-carbs" placeholder="g" class="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-center">
                                <button id="btn-log-custom" class="flex-1 bg-slate-600 text-white rounded px-2 py-1 text-xs font-bold">ADD</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="fuel-config-view" class="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 class="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2">Mission Configuration</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label class="block text-slate-400 text-xs font-bold mb-1">Drink Interval</label>
                            <input type="number" id="input-drink-int" value="15" class="w-full bg-slate-900 text-white border border-slate-600 rounded p-2 text-lg">
                        </div>
                        <div>
                            <label class="block text-slate-400 text-xs font-bold mb-1">Eat Interval</label>
                            <input type="number" id="input-eat-int" value="45" class="w-full bg-slate-900 text-white border border-slate-600 rounded p-2 text-lg">
                        </div>
                        <div>
                            <label class="block text-blue-400 text-xs font-bold mb-1">Bottle Carbs (g)</label>
                            <input type="number" id="input-bottle-carbs" value="90" class="w-full bg-slate-900 text-white border border-blue-500/50 rounded p-2 text-lg">
                        </div>
                        <div>
                            <label class="block text-emerald-400 text-xs font-bold mb-1">Hourly Target (g)</label>
                            <input type="number" id="input-target-hourly" value="90" class="w-full bg-slate-900 text-white border border-emerald-500/50 rounded p-2 text-lg">
                        </div>
                    </div>

                    <div class="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <div class="text-xs text-slate-500 uppercase tracking-widest mb-3">Customize Fuel Menu</div>
                        <div id="fuel-library-editor" class="space-y-2">
                            ${this.renderFuelEditor()}
                        </div>
                    </div>
                </div>

                <div class="mt-6">
                    <button id="btn-fuel-toggle" class="w-full py-4 rounded-xl font-bold text-xl uppercase tracking-widest transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg">
                        Start Engine
                    </button>
                    <button id="btn-fuel-reset" class="w-full mt-3 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all bg-slate-700 hover:bg-slate-600 text-slate-300 hidden">
                        Reset System
                    </button>
                </div>
            </div>
        `;
    },

    renderFuelButtons() {
        return this.state.fuelMenu.map(item => `
            <button class="btn-quick-fuel bg-slate-700 hover:bg-orange-600 hover:text-white text-slate-200 py-2 rounded-lg text-xs font-bold uppercase transition-colors flex flex-col items-center justify-center h-16 border border-slate-600"
                data-carbs="${item.carbs}">
                <i class="fa-solid ${item.icon} text-lg mb-1 opacity-70"></i>
                <span>${item.label} (${item.carbs}g)</span>
            </button>
        `).join('');
    },

    renderFuelEditor() {
        return this.state.fuelMenu.map((item, index) => `
            <div class="flex gap-2 items-center">
                <div class="w-8 text-center text-slate-500"><i class="fa-solid ${item.icon}"></i></div>
                <input type="text" value="${item.label}" class="edit-fuel-label flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white" data-index="${index}">
                <input type="number" value="${item.carbs}" class="edit-fuel-carbs w-20 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white text-center" data-index="${index}">
                <span class="text-slate-500 text-xs">g</span>
            </div>
        `).join('');
    },

    attachEvents() {
        const toggleBtn = document.getElementById('btn-fuel-toggle');
        const resetBtn = document.getElementById('btn-fuel-reset');
        const logSipBtn = document.getElementById('btn-log-sip');
        const showCustomBtn = document.getElementById('btn-show-custom-fuel');
        const logCustomBtn = document.getElementById('btn-log-custom');
        
        if(toggleBtn) toggleBtn.addEventListener('click', () => this.toggleTimer());
        if(resetBtn) resetBtn.addEventListener('click', () => this.resetTimer());
        if(logSipBtn) logSipBtn.addEventListener('click', () => this.logSip());
        
        // Custom Fuel Input Logic
        if(showCustomBtn) {
            showCustomBtn.addEventListener('click', () => {
                document.getElementById('custom-fuel-input-area').classList.remove('hidden');
                showCustomBtn.classList.add('hidden');
            });
        }
        if(logCustomBtn) {
            logCustomBtn.addEventListener('click', () => {
                const val = parseInt(document.getElementById('input-custom-carbs').value) || 0;
                if(val > 0) this.logFood(val);
                // Hide input again to keep UI clean
                document.getElementById('custom-fuel-input-area').classList.add('hidden');
                document.getElementById('btn-show-custom-fuel').classList.remove('hidden');
                document.getElementById('input-custom-carbs').value = '';
            });
        }

        // Quick Log Buttons (Delegation)
        const menuContainer = document.getElementById('fuel-menu-container');
        if(menuContainer) {
            menuContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-quick-fuel');
                if (btn) {
                    const carbs = parseInt(btn.dataset.carbs);
                    this.logFood(carbs);
                }
            });
        }

        // Config Inputs (Auto-save to state)
        document.querySelectorAll('.edit-fuel-label').forEach(el => {
            el.addEventListener('change', (e) => {
                const idx = e.target.dataset.index;
                this.state.fuelMenu[idx].label = e.target.value;
                this.refreshMenuRender();
            });
        });
        document.querySelectorAll('.edit-fuel-carbs').forEach(el => {
            el.addEventListener('change', (e) => {
                const idx = e.target.dataset.index;
                this.state.fuelMenu[idx].carbs = parseInt(e.target.value) || 0;
                this.refreshMenuRender();
            });
        });
    },

    refreshMenuRender() {
        const container = document.getElementById('fuel-menu-container');
        if (container) container.innerHTML = this.renderFuelButtons();
    },

    toggleTimer() {
        if (this.state.isRunning) this.pauseTimer();
        else this.startTimer();
    },

    startTimer() {
        // Read Intervals
        this.state.drinkInterval = parseInt(document.getElementById('input-drink-int').value) || 15;
        this.state.eatInterval = parseInt(document.getElementById('input-eat-int').value) || 45;
        this.state.carbsPerBottle = parseInt(document.getElementById('input-bottle-carbs').value) || 90;
        this.state.targetHourlyCarbs = parseInt(document.getElementById('input-target-hourly').value) || 90;

        if (this.state.totalTime === 0) {
            this.state.nextDrink = this.state.drinkInterval * 60;
            this.state.nextEat = this.state.eatInterval * 60;
        }

        // Switch Views
        document.getElementById('fuel-config-view').classList.add('hidden');
        document.getElementById('fuel-active-view').classList.remove('hidden');
        document.getElementById('btn-fuel-reset').classList.remove('hidden');
        
        const btn = document.getElementById('btn-fuel-toggle');
        btn.innerText = "Pause";
        btn.className = "w-full py-4 rounded-xl font-bold text-xl uppercase tracking-widest transition-all bg-yellow-600 hover:bg-yellow-500 text-white";

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
        btn.className = "w-full py-4 rounded-xl font-bold text-xl uppercase tracking-widest transition-all bg-emerald-600 hover:bg-emerald-500 text-white";
        
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
        
        // Reset Visuals
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
        btn.className = "w-full py-4 rounded-xl font-bold text-xl uppercase tracking-widest transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg";
    },

    logSip() {
        const sipsPerBottle = 4; // Estimate
        const carbsPerSip = this.state.carbsPerBottle / sipsPerBottle;
        
        this.state.totalCarbsConsumed += carbsPerSip;
        this.state.bottlesConsumed += (1 / sipsPerBottle);
        
        this.updateGauge();
        // Reset Timer
        this.state.nextDrink = this.state.drinkInterval * 60;
        this.updateCard('drink', this.state.nextDrink, this.state.drinkInterval);
    },

    logFood(carbs) {
        this.state.totalCarbsConsumed += carbs;
        this.updateGauge();
        
        // Reset Eat Timer when food is logged
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

    updatePacerBottle() {
        const hoursPassed = this.state.totalTime / 3600;
        const bottlesPerHour = this.state.targetHourlyCarbs / this.state.carbsPerBottle;
        const targetBottlesTotal = hoursPassed * bottlesPerHour;

        let fractionConsumed = targetBottlesTotal % 1;
        let percentRemaining = (1 - fractionConsumed) * 100;
        let currentBottleNumber = Math.floor(targetBottlesTotal) + 1;

        const liquid = document.getElementById('virtual-bottle-liquid');
        if(liquid) liquid.style.height = `${percentRemaining}%`;
        
        document.getElementById('bottle-percent-display').innerText = Math.round(percentRemaining);
        document.getElementById('target-bottle-count').innerText = currentBottleNumber;

        const expectedCarbs = hoursPassed * this.state.targetHourlyCarbs;
        document.getElementById('fuel-target-display').innerText = `Target: ${Math.round(expectedCarbs)}g`;
    },

    updateGauge() {
        document.getElementById('fuel-consumed-display').innerText = Math.round(this.state.totalCarbsConsumed);
        // Gauge fills to 200g then wraps or stays full? Let's scale it to Hourly Target * 3 for now
        const scaleLimit = this.state.targetHourlyCarbs * 3 || 300;
        const percentage = Math.min((this.state.totalCarbsConsumed / scaleLimit) * 100, 100);
        const gauge = document.getElementById('fuel-gauge-fill');
        if(gauge) gauge.style.width = `${percentage}%`;
    },

    updateCard(type, secondsLeft, intervalMins) {
        const timerEl = document.getElementById(`timer-${type}`);
        const cardEl = document.getElementById(type === 'drink' ? 'card-drink' : 'card-eat');

        if (secondsLeft <= 0) {
            timerEl.innerText = "NOW!";
            // Flash effect
            if (Math.abs(secondsLeft) % 2 === 0) {
                cardEl.classList.add(type === 'drink' ? 'border-blue-500' : 'border-orange-500');
                c