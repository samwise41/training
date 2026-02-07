import { UI } from '../../utils/ui.js';

export const FuelTimer = {
    state: {
        isRunning: false,
        startTime: null,
        totalTime: 0,
        
        // Config (Defaults)
        drinkInterval: 15, // minutes
        eatInterval: 45,   // minutes
        
        // Counters
        nextDrink: 15 * 60,
        nextEat: 45 * 60,
        
        timerId: null
    },

    // Simple beep sound (Base64 to avoid external files)
    beepSound: new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"), // Placeholder short beep

    init() {
        return `
            <div class="p-4 max-w-4xl mx-auto">
                <div class="flex justify-between items-center mb-6 bg-slate-900 p-4 rounded-xl border border-slate-700">
                    <div>
                        <h2 class="text-2xl font-bold text-white uppercase tracking-widest">Fuel Command</h2>
                        <div class="text-slate-400 text-sm">Indoor Training Assistant</div>
                    </div>
                    <div class="text-right">
                        <div id="fuel-total-time" class="text-4xl font-mono font-bold text-white">00:00:00</div>
                        <div class="text-xs text-slate-500 uppercase">Total Duration</div>
                    </div>
                </div>

                <div id="fuel-active-view" class="hidden grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    
                    <div id="card-drink" class="bg-blue-900/20 border-2 border-blue-500/50 rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-300">
                        <i class="fa-solid fa-bottle-water text-5xl text-blue-400 mb-4"></i>
                        <div class="text-blue-200 text-xl uppercase font-bold tracking-widest mb-2">Hydration</div>
                        <div id="timer-drink" class="text-7xl font-mono font-bold text-white mb-2">15:00</div>
                        <div class="text-blue-300/50 text-sm">Next Sip</div>
                    </div>

                    <div id="card-eat" class="bg-orange-900/20 border-2 border-orange-500/50 rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-300">
                        <i class="fa-solid fa-burger text-5xl text-orange-400 mb-4"></i>
                        <div class="text-orange-200 text-xl uppercase font-bold tracking-widest mb-2">Fueling</div>
                        <div id="timer-eat" class="text-7xl font-mono font-bold text-white mb-2">45:00</div>
                        <div class="text-orange-300/50 text-sm">Next Feed</div>
                    </div>

                </div>

                <div id="fuel-config-view" class="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <h3 class="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2">Mission Configuration</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label class="block text-blue-400 text-sm font-bold mb-2">Hydration Interval (Min)</label>
                            <input type="number" id="input-drink-int" value="15" class="w-full bg-slate-900 text-white border border-slate-600 rounded p-3 text-xl focus:border-blue-500 outline-none">
                        </div>
                        <div>
                            <label class="block text-orange-400 text-sm font-bold mb-2">Fueling Interval (Min)</label>
                            <input type="number" id="input-eat-int" value="45" class="w-full bg-slate-900 text-white border border-slate-600 rounded p-3 text-xl focus:border-orange-500 outline-none">
                        </div>
                    </div>
                </div>

                <button id="btn-fuel-toggle" class="w-full mt-6 py-6 rounded-xl font-bold text-2xl uppercase tracking-widest transition-all bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20">
                    Start Session
                </button>

                 <button id="btn-fuel-reset" class="w-full mt-4 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all bg-slate-700 hover:bg-slate-600 text-slate-300 hidden">
                    Reset / Configure
                </button>
            </div>
        `;
    },

    attachEvents() {
        const toggleBtn = document.getElementById('btn-fuel-toggle');
        const resetBtn = document.getElementById('btn-fuel-reset');
        
        toggleBtn.addEventListener('click', () => this.toggleTimer());
        resetBtn.addEventListener('click', () => this.resetTimer());
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

        // Update State
        this.state.drinkInterval = drinkInput;
        this.state.eatInterval = eatInput;
        
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
        btn.innerText = "Pause Session";
        btn.className = "w-full mt-6 py-6 rounded-xl font-bold text-2xl uppercase tracking-widest transition-all bg-yellow-600 hover:bg-yellow-500 text-white";

        this.state.isRunning = true;
        this.state.timerId = setInterval(() => this.tick(), 1000);
    },

    pauseTimer() {
        this.state.isRunning = false;
        clearInterval(this.state.timerId);
        
        const btn = document.getElementById('btn-fuel-toggle');
        btn.innerText = "Resume Session";
        btn.className = "w-full mt-6 py-6 rounded-xl font-bold text-2xl uppercase tracking-widest transition-all bg-emerald-600 hover:bg-emerald-500 text-white";
    },

    resetTimer() {
        this.pauseTimer();
        this.state.totalTime = 0;
        
        document.getElementById('fuel-total-time').innerText = "00:00:00";
        document.getElementById('timer-drink').innerText = "--:--";
        document.getElementById('timer-eat').innerText = "--:--";

        document.getElementById('fuel-config-view').classList.remove('hidden');
        document.getElementById('fuel-active-view').classList.add('hidden');
        document.getElementById('btn-fuel-reset').classList.add('hidden');

        const btn = document.getElementById('btn-fuel-toggle');
        btn.innerText = "Start Session";
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
    },

    updateCard(type, secondsLeft, intervalMins) {
        const timerEl = document.getElementById(`timer-${type}`);
        const cardEl = document.getElementById(`card-${type}`);

        // ALERT LOGIC
        if (secondsLeft <= 0) {
            // Flash Mode
            timerEl.innerText = "NOW!";
            
            // Toggle flash classes
            if (secondsLeft % 2 === 0) {
                cardEl.classList.remove('bg-slate-900');
                cardEl.classList.add(type === 'drink' ? 'bg-blue-600' : 'bg-orange-600');
                cardEl.classList.add('scale-105');
            } else {
                cardEl.classList.remove(type === 'drink' ? 'bg-blue-600' : 'bg-orange-600');
                cardEl.classList.remove('scale-105');
                // Play Sound every other second during alert
                // this.beepSound.play().catch(e => console.log("Audio blocked")); 
            }

            // Auto Reset logic (after 10 seconds of flashing, reset the interval)
            if (secondsLeft < -10) {
                 this.state[type === 'drink' ? 'nextDrink' : 'nextEat'] = intervalMins * 60;
                 // Reset visuals
                 cardEl.className = type === 'drink' 
                    ? "bg-blue-900/20 border-2 border-blue-500/50 rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-300"
                    : "bg-orange-900/20 border-2 border-orange-500/50 rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-300";
            }

        } else {
            // Normal Count Down
            timerEl.innerText = this.formatTime(secondsLeft);
        }
    },

    formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        
        if (h > 0) {
             return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
};
