import { DataManager } from '../../utils/data.js';
import { FuelState } from './state.js';
import { FuelView } from './view.js';

export const FuelTimer = {
    state: FuelState,

    // Audio Object
    beepSound: new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"), 

    async init() {
        let library = await DataManager.fetchJSON('fuelLibrary');
        
        if (!library || library.length === 0) {
            library = [
                { id: 'gel', label: 'Gel', carbs: 22, icon: 'fa-bolt', active: true },
                { id: 'chews', label: 'Chews', carbs: 24, icon: 'fa-candy-cane', active: true },
                { id: 'bar', label: 'Bar', carbs: 40, icon: 'fa-cookie-bite', active: true }
            ];
        }
        
        // Default ALL items to FALSE (Hidden) initially
        this.state.fuelMenu = library.map(item => ({ 
            ...item, 
            active: false 
        }));
        
        return FuelView.getHtml(this.state);
    },

    attachEvents() {
        const bind = (id, fn) => { const el = document.getElementById(id); if(el) el.addEventListener('click', fn); };

        bind('btn-fuel-toggle', () => this.toggleTimer());
        bind('btn-fuel-reset', () => this.resetTimer());
        bind('btn-log-sip', () => this.logSip());
        bind('btn-log-custom', () => {
            const input = document.getElementById('input-custom-carbs');
            const val = parseInt(input.value) || 0;
            if(val > 0) { this.logFood(val, "Custom Entry"); input.value = ''; }
            this.toggleCustomInput(false);
        });
        bind('btn-show-custom-fuel', () => this.toggleCustomInput(true));
        bind('btn-add-item', () => this.addNewItem());
        
        // Toggle All / None
        bind('btn-toggle-all-fuel', () => {
            const allActive = this.state.fuelMenu.every(i => i.active);
            this.state.fuelMenu.forEach(i => i.active = !allActive);
            this.refreshUI();
        });

        // Quick Fuel Buttons
        const menu = document.getElementById('fuel-menu-container');
        if(menu) menu.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-quick-fuel');
            if(btn) {
                const carbs = parseInt(btn.dataset.carbs);
                const name = btn.dataset.name;
                this.logFood(carbs, name);
            }
        });

        // Delete from Log
        const log = document.getElementById('fuel-history-log');
        if(log) log.addEventListener('click', (e) => {
            const row = e.target.closest('.btn-delete-log');
            if(row) {
                const index = parseInt(row.dataset.index);
                if(confirm("Remove this entry?")) {
                    this.removeLogEntry(index);
                }
            }
        });

        // Settings Toggles
        const editor = document.getElementById('fuel-library-editor');
        if(editor) editor.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-toggle-active');
            if(btn) {
                const idx = btn.dataset.index;
                this.state.fuelMenu[idx].active = !this.state.fuelMenu[idx].active;
                this.refreshUI();
            }
        });
    },

    toggleTimer() {
        if (this.state.isRunning) this.pauseTimer();
        else this.startTimer();
    },

    startTimer() {
        this.unlockAudio(); // Important: Fixes audio on mobile
        this.readConfigInputs();
        if (this.state.totalTime === 0) {
            this.state.nextDrink = this.state.drinkInterval * 60;
            this.state.nextEat = this.state.eatInterval * 60;
        }
        this.switchView('active');
        this.state.isRunning = true;
        this.state.timerId = setInterval(() => this.tick(), 1000);
        this.updateBtnState('Pause', 'bg-yellow-600');
    },

    pauseTimer() {
        this.state.isRunning = false;
        clearInterval(this.state.timerId);
        this.updateBtnState('Resume', 'bg-emerald-600');
    },

    resetTimer() {
        this.pauseTimer();
        this.state.resetSession();
        this.updateDisplays();
        this.refreshLogUI(); // Clear Log
        this.switchView('config');
        this.updateBtnState('Start Engine', 'bg-emerald-600');
    },

    tick() {
        this.state.totalTime++;
        this.state.nextDrink--;
        this.state.nextEat--;
        this.updateDisplays();
    },

    // Browser Audio Unlock Policy
    unlockAudio() {
        this.beepSound.play()
            .then(() => {
                this.beepSound.pause();
                this.beepSound.currentTime = 0;
            })
            .catch(e => console.log("Audio unlock waiting for gesture", e));
    },

    logSip() {
        const sips = 4; 
        const amount = this.state.carbsPerBottle / sips;
        this.state.totalCarbsConsumed += amount;
        this.state.bottlesConsumed += (1 / sips);
        
        // Log bottleAmount so we can reverse it if deleted
        this.addToLog('drink', 'Bottle Sip', Math.round(amount), (1/sips));
        
        this.state.nextDrink = this.state.drinkInterval * 60;
        this.updateDisplays();
    },

    logFood(carbs, name) {
        this.state.totalCarbsConsumed += carbs;
        this.addToLog('eat', name || 'Food', carbs, 0);
        this.state.nextEat = this.state.eatInterval * 60;
        this.updateDisplays();
    },

    addToLog(type, item, carbs, bottleAmount = 0) {
        const timeStr = FuelView.formatTime(this.state.totalTime);
        this.state.consumptionLog.push({ type, item, carbs, bottleAmount, time: timeStr });
        this.refreshLogUI();
    },

    removeLogEntry(index) {
        const entry = this.state.consumptionLog[index];
        if(!entry) return;

        // Reverse the stats
        this.state.totalCarbsConsumed -= entry.carbs;
        if(this.state.totalCarbsConsumed < 0) this.state.totalCarbsConsumed = 0;

        if(entry.type === 'drink') {
            this.state.bottlesConsumed -= entry.bottleAmount;
            if(this.state.bottlesConsumed < 0) this.state.bottlesConsumed = 0;
        }

        // Remove from array
        this.state.consumptionLog.splice(index, 1);
        
        // Refresh UI
        this.updateDisplays();
        this.refreshLogUI();
    },

    refreshLogUI() {
        const logContainer = document.getElementById('fuel-history-log');
        if (logContainer) {
            logContainer.innerHTML = FuelView.renderHistoryLog(this.state.consumptionLog);
            // Auto scroll to bottom
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    },

    addNewItem() {
        const nameInput = document.getElementById('new-item-name');
        const carbsInput = document.getElementById('new-item-carbs');
        const name = nameInput.value.trim();
        const carbs = parseInt(carbsInput.value) || 0;
        if (name && carbs > 0) {
            this.state.fuelMenu.push({ id: 'c_'+Date.now(), label: name, carbs, icon: 'fa-utensils', active: true });
            nameInput.value = ''; carbsInput.value = '';
            this.refreshUI();
        }
    },

    readConfigInputs() {
        const getVal = (id) => parseInt(document.getElementById(id).value) || 0;
        this.state.drinkInterval = getVal('input-drink-int') || 15;
        this.state.eatInterval = getVal('input-eat-int') || 45;
        this.state.carbsPerBottle = getVal('input-bottle-carbs') || 90;
        this.state.targetHourlyCarbs = getVal('input-target-hourly') || 90;
    },

    updateDisplays() {
        document.getElementById('fuel-total-time').innerText = FuelView.formatTime(this.state.totalTime);
        this.updateGauge();
        this.updatePacerBottle();
        this.updateCard('drink', this.state.nextDrink, this.state.drinkInterval);
        this.updateCard('eat', this.state.nextEat, this.state.eatInterval);
    },

    updateGauge() {
        document.getElementById('fuel-consumed-display').innerText = Math.round(this.state.totalCarbsConsumed);
        const pct = Math.min((this.state.totalCarbsConsumed / 300) * 100, 100);
        const el = document.getElementById('fuel-gauge-fill');
        if(el) el.style.width = `${pct}%`;
    },

    updatePacerBottle() {
        const hours = this.state.totalTime / 3600;
        const totalBottles = hours * (this.state.targetHourlyCarbs / this.state.carbsPerBottle);
        
        let pct = 100;
        let currentBottle = 1;

        if (totalBottles > 0) {
            pct = (1 - (totalBottles % 1)) * 100;
            currentBottle = Math.floor(totalBottles) + 1;
        }
        
        const liq = document.getElementById('virtual-bottle-liquid');
        if(liq) liq.style.height = `${pct}%`;
        
        document.getElementById('bottle-percent-display').innerText = Math.round(pct);
        document.getElementById('target-bottle-count').innerText = currentBottle;
        document.getElementById('fuel-target-display').innerText = `Target: ${Math.round(hours * this.state.targetHourlyCarbs)}g`;
    },

    updateCard(type, sec, interval) {
        const el = document.getElementById(`timer-${type}`);
        const card = document.getElementById(`card-${type}`);
        
        if(sec <= 0) {
            el.innerText = "NOW!";
            // Play sound every 5 seconds if alerting
            if (sec % 5 === 0) {
                this.beepSound.play().catch(() => {}); 
            }

            const color = type === 'drink' ? 'blue' : 'orange';
            card.classList.toggle(`border-${color}-500`, Math.abs(sec)%2===0);
            
            if(sec < -60) this.state[type==='drink'?'nextDrink':'nextEat'] = interval * 60; 
        } else {
            el.innerText = FuelView.formatTime(sec);
            card.className = `bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center`;
        }
    },

    toggleCustomInput(show) {
        const area = document.getElementById('custom-fuel-input-area');
        const btn = document.getElementById('btn-show-custom-fuel');
        if(show) { area.classList.remove('hidden'); btn.classList.add('hidden'); }
        else { area.classList.add('hidden'); btn.classList.remove('hidden'); }
    },

    refreshUI() {
        const menu = document.getElementById('fuel-menu-container');
        const editor = document.getElementById('fuel-library-editor');
        if(menu) menu.innerHTML = FuelView.renderFuelButtons(this.state.fuelMenu);
        if(editor) editor.innerHTML = FuelView.renderFuelEditor(this.state.fuelMenu);
    },

    switchView(view) {
        const config = document.getElementById('fuel-config-view');
        const active = document.getElementById('fuel-active-view');
        const resetBtn = document.getElementById('btn-fuel-reset');
        
        if(view === 'active') {
            config.classList.add('hidden');
            active.classList.remove('hidden');
            resetBtn.classList.remove('hidden');
        } else {
            config.classList.remove('hidden');
            active.classList.add('hidden');
            resetBtn.classList.add('hidden');
        }
    },

    updateBtnState(text, bgClass) {
        const btn = document.getElementById('btn-fuel-toggle');
        btn.innerText = text;
        btn.className = `w-full py-4 rounded-xl font-bold text-xl uppercase tracking-widest text-white shadow-lg transition-colors ${bgClass}`;
    }
};
