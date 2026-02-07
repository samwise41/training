import { DataManager } from '../../utils/data.js';
import { FuelState } from './state.js';
import { FuelView } from './view.js';

export const FuelTimer = {
    state: FuelState,
    
    // Web Audio Context (Lazily created)
    audioCtx: null,

    async init() {
        // 1. Load Data
        let library = await DataManager.fetchJSON('fuelLibrary');
        
        // 2. Safety Fallback
        if (!library || library.length === 0) {
            library = [
                { id: 'gel', label: 'Gel', carbs: 22, icon: 'fa-bolt', active: true },
                { id: 'chews', label: 'Chews', carbs: 24, icon: 'fa-candy-cane', active: true },
                { id: 'bar', label: 'Bar', carbs: 40, icon: 'fa-cookie-bite', active: true }
            ];
        }
        
        // 3. Initialize Menu
        // If restoring a session, we trust the saved state. Otherwise default all to hidden.
        if (this.state.totalTime === 0) {
            this.state.fuelMenu = library.map(item => ({ ...item, active: false }));
        } else {
            // If we have a library update but a saved session, try to merge active states
            // For simplicity, we just reload the library and default to hidden if starting fresh
            this.state.fuelMenu = library.map(item => ({ ...item, active: false }));
        }
        
        // 4. Persistence Check
        const hasSavedSession = this.state.load();
        if (hasSavedSession) {
            // Restore menu state if needed, or just let user re-select
        }

        // 5. Render
        const html = FuelView.getHtml(this.state);

        // 6. Auto-Restore View if crashed
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
        bind('btn-log-sip', () => this.logSip());
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

    // --- AUDIO SYSTEM (Web Audio API) ---
    
    initAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },

    playAlertTone() {
        if (!this.audioCtx) this.initAudio();
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        // Create Oscillator (Synthesizer)
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        // Sound Profile: High Pitch "Beep-Beep"
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); // A5
        osc.frequency.setValueAtTime(0, this.audioCtx.currentTime + 0.1); // Silence
        osc.frequency.setValueAtTime(880, this.audioCtx.currentTime + 0.15); // A5
        
        // Envelope
        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.3);
    },

    // --- CORE LOGIC ---

    toggleTimer() {
        if (this.state.isRunning) this.pauseTimer();
        else this.startTimer();
    },

    startTimer() {
        // Unlock Audio on user gesture (Crucial for Mobile)
        this.initAudio();
        this.audioCtx.resume().then(() => {
            console.log("Audio Engine Unlocked");
        });

        this.enableNavigationGuards();
        
        if (this.state.totalTime === 0) {
            this.readConfigInputs();
            this.state.nextDrink = this.state.drinkInterval * 60;
            this.state.nextEat = this.state.eatInterval * 60;
        }
        
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
        this.state.totalTime++;
        this.state.nextDrink--;
        this.state.nextEat--;
        this.updateDisplays();
        this.state.save();
    },

    // --- LOGIC ---

    logSip() {
        const sips = 4; 
        const amount = this.state.carbsPerBottle / sips;
        this.state.totalCarbsConsumed += amount;
        this.state.bottlesConsumed += (1 / sips);
        
        this.addToLog('drink', 'Bottle Sip', Math.round(amount), (1/sips));
        
        this.state.nextDrink = this.state.drinkInterval * 60;
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

    addToLog(type, item, carbs, bottleAmount = 0) {
        const timeStr = FuelView.formatTime(this.state.totalTime);
        this.state.consumptionLog.push({ type, item, carbs, bottleAmount, time: timeStr });
        this.refreshLogUI();
    },

    removeLogEntry(index) {
        const entry = this.state.consumptionLog[index];
        if(!entry) return;

        this.state.totalCarbsConsumed -= entry.carbs;
        if(this.state.totalCarbsConsumed < 0) this.state.totalCarbsConsumed = 0;

        if(entry.type === 'drink') {
            this.state.bottlesConsumed -= entry.bottleAmount;
            if(this.state.bottlesConsumed < 0) this.state.bottlesConsumed = 0;
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

    // --- DISPLAY UPDATES ---

    updateDisplays() {
        document.getElementById('fuel-total-time').innerText = FuelView.formatTime(this.state.totalTime);
        this.updateGauge();
        this.updatePacerBottle();
        this.updateCard('drink', this.state.nextDrink, this.state.drinkInterval);
        this.updateCard('eat', this.state.nextEat, this.state.eatInterval);
    },

    updateCard(type, sec, interval) {
        const el = document.getElementById(`timer-${type}`);
        const card = document.getElementById(`card-${type}`);
        
        if (sec <= 0) {
            // OVERDUE MODE
            const overdue = Math.abs(sec);
            el.innerText = `+${FuelView.formatTime(overdue)}`;
            
            // Visual Urgency
            el.classList.remove('text-white');
            el.classList.add('text-red-500', 'animate-pulse');
            
            const color = type === 'drink' ? 'blue' : 'orange';
            card.classList.add(`border-${color}-500`);
            card.classList.toggle('bg-slate-700', overdue % 2 === 0);

            // Audio Alert (Every 10s to avoid annoyance)
            if (overdue % 10 === 0) this.playAlertTone();
            
            // Safety Reset extended to 5 minutes (300s)
            if (sec < -300) {
                this.state[type==='drink'?'nextDrink':'nextEat'] = interval * 60; 
            }
        } else {
            // NORMAL MODE
            el.innerText = FuelView.formatTime(sec);
            
            // Restore Styles
            el.classList.add('text-white');
            el.classList.remove('text-red-500', 'animate-pulse');
            card.className = `bg-slate-800 border-2 border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center`;
        }
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

    // --- HELPERS ---

    readConfigInputs() {
        const getVal = (id) => parseInt(document.getElementById(id).value) || 0;
        this.state.drinkInterval = getVal('input-drink-int') || 15;
        this.state.eatInterval = getVal('input-eat-int') || 45;
        this.state.carbsPerBottle = getVal('input-bottle-carbs') || 90;
        this.state.targetHourlyCarbs = getVal('input-target-hourly') || 90;
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
