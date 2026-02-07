import { DataManager } from '../../utils/data.js';
import { FuelState } from './state.js';
import { FuelView } from './view.js';

export const FuelTimer = {
    state: FuelState,
    audioCtx: null,

    async init() {
        let library = await DataManager.fetchJSON('fuelLibrary');
        if (!library || library.length === 0) {
            library = [
                { id: 'gel', label: 'Gel', carbs: 22, icon: 'fa-bolt', active: true },
                { id: 'chews', label: 'Chews', carbs: 24, icon: 'fa-candy-cane', active: true },
                { id: 'bar', label: 'Bar', carbs: 40, icon: 'fa-cookie-bite', active: true }
            ];
        }
        
        if (this.state.totalTime === 0) {
            this.state.fuelMenu = library.map(item => ({ ...item, active: false }));
        }
        
        const hasSavedSession = this.state.load();
        const html = FuelView.getHtml(this.state);

        if (hasSavedSession && this.state.totalTime > 0) {
            setTimeout(() => {
                this.switchView('active');
                this.updateDisplays();
                this.refreshLogUI();
                this.updateBtnState('Resume Session', 'bg-emerald-600');
                this.enableNavigationGuards();
            }, 100);
        }

        return html;
    },

    attachEvents() {
        const bind = (id, fn) => { const el = document.getElementById(id); if(el) el.addEventListener('click', fn); };

        bind('btn-fuel-toggle', () => this.toggleTimer());
        bind('btn-fuel-reset', () => this.resetTimer());
        
        bind('btn-log-sip-mix', () => this.logSip('mix'));
        bind('btn-log-sip-water', () => this.logSip('water'));

        bind('btn-log-custom', () => {
            const input = document.getElementById('input-custom-carbs');
            const val = parseInt(input.value) || 0;
            if(val > 0) { this.logFood(val, "Custom Entry"); input.value = ''; }
            this.toggleCustomInput(false);
        });
        bind('btn-show-custom-fuel', () => this.toggleCustomInput(true));
        bind('btn-add-item', () => this.addNewItem());
        
        bind('btn-toggle-all-fuel', () => {
            const allActive = this.state.fuelMenu.every(i => i.active);
            this.state.fuelMenu.forEach(i => i.active = !allActive);
            this.refreshUI();
        });

        const menu = document.getElementById('fuel-menu-container');
        if(menu) menu.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-quick-fuel');
            if(btn) this.logFood(parseInt(btn.dataset.carbs), btn.dataset.name);
        });

        const log = document.getElementById('fuel-history-log');
        if(log) log.addEventListener('click', (e) => {
            const row = e.target.closest('.btn-delete-log');
            if(row && confirm("Remove this entry?")) this.removeLogEntry(parseInt(row.dataset.index));
        });

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

    initAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },

    playAlertTone() {
        if (!this.audioCtx) this.initAudio();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); 
        osc.frequency.setValueAtTime(0, this.audioCtx.currentTime + 0.1); 
        osc.frequency.setValueAtTime(880, this.audioCtx.currentTime + 0.15); 
        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.3);
    },

    toggleTimer() {
        if (this.state.isRunning) this.pauseTimer();
        else this.startTimer();
    },

    startTimer() {
        this.initAudio();
        this.audioCtx.resume();
        this.enableNavigationGuards();
        
        if (this.state.totalTime === 0) {
            this.readConfigInputs();
            this.state.nextDrink = this.state.drinkInterval * 60;
            this.state.nextEat = this.state.eatInterval * 60;
        }
        
        this.state.lastTickTimestamp = Date.now();
        this.switchView('active');
        this.state.isRunning = true;
        this.state.timerId = setInterval(() => this.tick(), 1000);
        this.updateBtnState('Pause', 'bg-yellow-600');
        this.state.save();
    },

    pauseTimer() {
        this.state.isRunning = false;
        clearInterval(this.state.timerId);
        this.updateBtnState('Resume', 'bg-emerald-600');
        this.state.save();
    },

    resetTimer() {
        if(!confirm("End session and clear data?")) return;
        this.pauseTimer();
        this.disableNavigationGuards();
        this.state.resetSession();
        this.updateDisplays();
        this.refreshLogUI();
        this.switchView('config');
        this.updateBtnState('Start Engine', 'bg-emerald-600');
    },

    tick() {
        const now = Date.now();
        const delta = Math.floor((now - this.state.lastTickTimestamp) / 1000);
        if (delta > 0) {
            this.state.totalTime += delta;
            this.state.nextDrink -= delta;
            this.state.nextEat -= delta;
            this.state.lastTickTimestamp = now;
            this.updateDisplays();
            this.state.save();
        }
    },

    logSip(type) {
        const sipsPerBottle = 4;
        const bottleVol = this.state.bottleVolume || 750;
        const fluidAmount = Math.round(bottleVol / sipsPerBottle);
        let carbAmount = 0;

        if (type === 'mix') {
            carbAmount = Math.round((this.state.carbsPerBottle || 90) / sipsPerBottle);
            this.state.totalCarbsConsumed += carbAmount;
            this.state.bottlesConsumed += (1 / sipsPerBottle);
            this.state.nextDrink = this.state.drinkInterval * 60;
        } else {
            this.state.waterBottlesConsumed += (1 / sipsPerBottle);
            this.state.nextDrink = this.state.drinkInterval * 60;
        }

        this.state.totalFluidConsumed += fluidAmount;
        this.addToLog(type === 'mix' ? 'drink' : 'water', type === 'mix' ? 'Mix Sip' : 'Water Sip', carbAmount, fluidAmount);
        this.updateDisplays();
        this.state.save();
    },

    logFood(carbs, name) {
        this.state.totalCarbsConsumed += carbs;
        this.addToLog('eat', name || 'Food', carbs, 0);
        this.state.nextEat = this.state.eatInterval * 60;
        this.updateDisplays();
        this.state.save();
    },

    addToLog(type, item, carbs, fluid = 0) {
        const timeStr = FuelView.formatTime(this.state.totalTime);
        this.state.consumptionLog.push({ type, item, carbs, fluid, time: timeStr });
        this.refreshLogUI();
    },

    removeLogEntry(index) {
        const entry = this.state.consumptionLog[index];
        if(!entry) return;

        this.state.totalCarbsConsumed -= entry.carbs;
        if(this.state.totalCarbsConsumed < 0) this.state.totalCarbsConsumed = 0;

        this.state.totalFluidConsumed -= (entry.fluid || 0);
        if(this.state.totalFluidConsumed < 0) this.state.totalFluidConsumed = 0;

        if(entry.type === 'drink') {
             this.state.bottlesConsumed -= 0.25;
             if(this.state.bottlesConsumed < 0) this.state.bottlesConsumed = 0;
        } else if (entry.type === 'water') {
             this.state.waterBottlesConsumed -= 0.25;
             if(this.state.waterBottlesConsumed < 0) this.state.waterBottlesConsumed = 0;
        }

        this.state.consumptionLog.splice(index, 1);
        this.updateDisplays();
        this.refreshLogUI();
        this.state.save();
    },

    refreshLogUI() {
        const logContainer = document.getElementById('fuel-history-log');
        if (logContainer) {
            logContainer.innerHTML = FuelView.renderHistoryLog(this.state.consumptionLog);
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

    updateDisplays() {
        document.getElementById('fuel-total-time').innerText = FuelView.formatTime(this.state.totalTime);
        document.getElementById('fuel-consumed-display').innerText = Math.round(this.state.totalCarbsConsumed);
        document.getElementById('fluid-consumed-display').innerText = Math.round(this.state.totalFluidConsumed);
        
        this.updateProgressBars(); // Ensure this calls the right function now!
        this.updateCard('drink', this.state.nextDrink, this.state.drinkInterval);
        this.updateCard('eat', this.state.nextEat, this.state.eatInterval);
    },

    updateProgressBars() {
        const durationHours = (this.state.plannedDuration || 180) / 60;
        
        // 1. Carb Calculations
        const carbGoal = durationHours * this.state.targetHourlyCarbs;
        const carbPct = Math.min((this.state.totalCarbsConsumed / carbGoal) * 100, 100);
        document.getElementById('carb-val').innerText = Math.round(this.state.totalCarbsConsumed);
        document.getElementById('carb-target').innerText = Math.round(carbGoal);
        document.getElementById('carb-progress-bar').style.width = `${carbPct}%`;
        
        // 2. Fluid Calculations
        const fluidGoal = durationHours * (this.state.targetHourlyFluid || 500);
        const fluidPct = Math.min((this.state.totalFluidConsumed / fluidGoal) * 100, 100);
        document.getElementById('fluid-val').innerText = Math.round(this.state.totalFluidConsumed);
        document.getElementById('fluid-target').innerText = Math.round(fluidGoal);
        document.getElementById('fluid-progress-bar').style.width = `${fluidPct}%`;

        // 3. Pacer Markers (Where should I be right now?)
        const progressPct = Math.min((this.state.totalTime / (this.state.plannedDuration * 60)) * 100, 100);
        document.getElementById('carb-pacer-marker').style.left = `${progressPct}%`;
        document.getElementById('fluid-pacer-marker').style.left = `${progressPct}%`;
    },

    updateCard(type, sec, interval) {
        const el = document.getElementById(`timer-${type}`);
        const card = document.getElementById(`card-${type}`);
        
        if (sec <= 0) {
            const overdue = Math.abs(sec);
            el.innerText = `+${FuelView.formatTime(overdue)}`;
            el.classList.remove('text-white');
            el.classList.add('text-red-500', 'animate-pulse');
            const color = type === 'drink' ? 'blue' : 'orange';
            card.classList.add(`border-${color}-500`);
            card.classList.toggle('bg-slate-700', overdue % 2 === 0);
            if (overdue % 10 === 0) this.playAlertTone();
            if (sec < -300) this.state[type==='drink'?'nextDrink':'nextEat'] = interval * 60; 
        } else {
            el.innerText = FuelView.formatTime(sec);
            el.classList.add('text-white');
            el.classList.remove('text-red-500', 'animate-pulse');
            card.className = `bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center`;
        }
    },

    readConfigInputs() {
        const getVal = (id) => parseInt(document.getElementById(id).value) || 0;
        this.state.drinkInterval = getVal('input-drink-int') || 15;
        this.state.eatInterval = getVal('input-eat-int') || 45;
        this.state.carbsPerBottle = getVal('input-bottle-carbs') || 90;
        this.state.bottleVolume = getVal('input-bottle-vol') || 750;
        this.state.targetHourlyCarbs = getVal('input-target-hourly') || 90;
        this.state.targetHourlyFluid = getVal('input-target-fluid') || 500; // New
        this.state.plannedDuration = getVal('input-planned-duration') || 180;
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
    },

    enableNavigationGuards() {
        history.pushState(null, document.title, location.href);
        window.addEventListener('popstate', this.handlePopState);
        window.addEventListener('beforeunload', this.handleBeforeUnload);
    },

    disableNavigationGuards() {
        window.removeEventListener('popstate', this.handlePopState);
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
    },

    handlePopState(event) {
        history.pushState(null, document.title, location.href);
    },

    handleBeforeUnload(e) {
        e.preventDefault();
        e.returnValue = ''; 
    }
};
