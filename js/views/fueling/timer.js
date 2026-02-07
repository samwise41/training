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
        
        // FIX: Check if menu is empty, not just time. Ensures items are populated.
        if (this.state.fuelMenu.length === 0) {
            this.state.fuelMenu = library.map(item => ({ ...item, active: true }));
        }
        
        const hasSavedSession = this.state.load();
        const html = FuelView.getHtml(this.state);

        if (hasSavedSession && this.state.totalTime > 0) {
            setTimeout(() => {
                this.switchView('active');
                this.updateDisplays();
                this.refreshLogUI();
                this.updateBtnState('Resume Session', 'bg-emerald-600');
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
        bind('btn-log-flask', () => this.logFlask());
        bind('btn-fuel-help', () => this.toggleHelp(true));
        bind('btn-close-help', () => this.toggleHelp(false));
        bind('btn-dismiss-help', () => this.toggleHelp(false));

        bind('btn-show-custom-fuel', () => {
            const area = document.getElementById('custom-fuel-input-area');
            const btn = document.getElementById('btn-show-custom-fuel');
            if(area) {
                area.classList.toggle('hidden');
                btn.innerText = area.classList.contains('hidden') ? 'Custom' : 'Hide';
            }
        });

        bind('btn-log-custom', () => {
            const input = document.getElementById('input-custom-carbs');
            const area = document.getElementById('custom-fuel-input-area');
            const val = parseInt(input.value) || 0;
            if(val > 0) { 
                this.logFood(val, "Custom Entry"); 
                input.value = ''; 
                if(area) {
                    area.classList.add('hidden');
                    document.getElementById('btn-show-custom-fuel').innerText = 'Custom';
                }
            }
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
        
        bind('btn-add-item', () => this.addNewItem());
        bind('btn-toggle-all-fuel', () => {
            const allActive = this.state.fuelMenu.every(i => i.active);
            this.state.fuelMenu.forEach(i => i.active = !allActive);
            this.refreshUI();
        });
    },

    toggleHelp(show) { document.getElementById('fuel-help-modal').classList.toggle('hidden', !show); },
    initAudio() { if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); },
    playAlertTone() { if (!this.audioCtx) this.initAudio(); if (this.audioCtx.state === 'suspended') this.audioCtx.resume(); const osc = this.audioCtx.createOscillator(); const gain = this.audioCtx.createGain(); osc.connect(gain); gain.connect(this.audioCtx.destination); osc.type = 'square'; osc.frequency.setValueAtTime(880, this.audioCtx.currentTime); osc.frequency.setValueAtTime(0, this.audioCtx.currentTime + 0.1); osc.frequency.setValueAtTime(880, this.audioCtx.currentTime + 0.15); gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3); osc.start(); osc.stop(this.audioCtx.currentTime + 0.3); },
    toggleTimer() { if (this.state.isRunning) this.pauseTimer(); else this.startTimer(); },
    startTimer() { this.initAudio(); this.audioCtx.resume(); if (this.state.totalTime === 0) { this.readConfigInputs(); this.state.nextDrink = this.state.drinkInterval * 60; this.state.nextEat = this.state.eatInterval * 60; } this.state.lastTickTimestamp = Date.now(); this.switchView('active'); this.state.isRunning = true; this.state.timerId = setInterval(() => this.tick(), 1000); this.updateBtnState('Pause', 'bg-yellow-600'); this.state.save(); this.updateDisplays(); },
    pauseTimer() { this.state.isRunning = false; clearInterval(this.state.timerId); this.updateBtnState('Resume', 'bg-emerald-600'); this.state.save(); },
    resetTimer() { if(!confirm("End session?")) return; this.pauseTimer(); this.state.resetSession(); this.updateDisplays(); this.refreshLogUI(); this.switchView('config'); this.updateBtnState('Start Engine', 'bg-emerald-600'); },
    tick() { const now = Date.now(); const delta = Math.floor((now - this.state.lastTickTimestamp) / 1000); if (delta > 0) { this.state.totalTime += delta; this.state.nextDrink -= delta; this.state.nextEat -= delta; this.state.lastTickTimestamp = now; this.updateDisplays(); this.state.save(); } },
    logSip(type) { const sips = this.state.sipsPerBottle || 4; const vol = this.state.bottleVolume || 750; const fluid = Math.round(vol / sips); const portion = 1 / sips; let carbs = 0; if (type === 'mix') { carbs = Math.round((this.state.carbsPerBottle || 90) / sips); this.state.totalCarbsConsumed += carbs; this.state.bottlesConsumed += portion; this.state.nextDrink = this.state.drinkInterval * 60; } else { this.state.waterBottlesConsumed += portion; this.state.nextDrink = this.state.drinkInterval * 60; } this.state.totalFluidConsumed += fluid; this.addToLog(type === 'mix' ? 'drink' : 'water', type === 'mix' ? 'Mix Sip' : 'Water Sip', carbs, fluid); this.updateDisplays(); this.state.save(); },
    logFlask() { const sqz = this.state.squeezesPerFlask || 4; const portion = 1 / sqz; const carbs = Math.round((this.state.carbsPerFlask || 150) * portion); this.state.totalCarbsConsumed += carbs; this.state.flasksConsumed += portion; this.state.nextEat = this.state.eatInterval * 60; this.addToLog('flask', 'Flask Squeeze', carbs, 0); this.updateDisplays(); this.state.save(); },
    logFood(carbs, name) { this.state.totalCarbsConsumed += carbs; this.addToLog('eat', name || 'Food', carbs, 0); this.state.nextEat = this.state.eatInterval * 60; this.updateDisplays(); this.state.save(); },
    addToLog(type, item, carbs, fluid) { const timeStr = FuelView.formatTime(this.state.totalTime); this.state.consumptionLog.push({ type, item, carbs, fluid, time: timeStr }); this.refreshLogUI(); },
    removeLogEntry(index) { const entry = this.state.consumptionLog[index]; if(!entry) return; this.state.totalCarbsConsumed -= entry.carbs; if(this.state.totalCarbsConsumed < 0) this.state.totalCarbsConsumed = 0; this.state.totalFluidConsumed -= (entry.fluid || 0); if(this.state.totalFluidConsumed < 0) this.state.totalFluidConsumed = 0; if(entry.type === 'drink') this.state.bottlesConsumed -= (1 / (this.state.sipsPerBottle || 4)); if(entry.type === 'water') this.state.waterBottlesConsumed -= (1 / (this.state.sipsPerBottle || 4)); if(entry.type === 'flask') this.state.flasksConsumed -= (1 / (this.state.squeezesPerFlask || 4)); this.state.consumptionLog.splice(index, 1); this.updateDisplays(); this.refreshLogUI(); this.state.save(); },
    refreshLogUI() { const log = document.getElementById('fuel-history-log'); if (log) log.innerHTML = FuelView.renderHistoryLog(this.state.consumptionLog); },
    addNewItem() { const nameInput = document.getElementById('new-item-name'); const carbsInput = document.getElementById('new-item-carbs'); const name = nameInput.value.trim(); const carbs = parseInt(carbsInput.value) || 0; if (name && carbs > 0) { this.state.fuelMenu.push({ id: 'c_'+Date.now(), label: name, carbs, icon: 'fa-utensils', active: true }); nameInput.value = ''; carbsInput.value = ''; this.refreshUI(); } },
    updateDisplays() { const timeEl = document.getElementById('fuel-total-time'); if (timeEl) timeEl.innerText = FuelView.formatTime(this.state.totalTime); this.updateBottleVisuals(); this.updateProgressBars(); this.updateCard('drink', this.state.nextDrink); this.updateCard('eat', this.state.nextEat); },
    updateBottleVisuals() { if(!document.getElementById('mix-bottle-liquid')) return; const mixPct = (1 - (this.state.bottlesConsumed % 1)) * 100; document.getElementById('mix-bottle-liquid').style.height = `${mixPct}%`; document.getElementById('mix-bottle-count').innerText = Math.floor(this.state.bottlesConsumed) + 1; const waterPct = (1 - (this.state.waterBottlesConsumed % 1)) * 100; document.getElementById('water-bottle-liquid').style.height = `${waterPct}%`; document.getElementById('water-bottle-count').innerText = Math.floor(this.state.waterBottlesConsumed) + 1; const flaskPct = (1 - (this.state.flasksConsumed % 1)) * 100; document.getElementById('flask-liquid').style.height = `${flaskPct}%`; document.getElementById('flask-count').innerText = Math.floor(this.state.flasksConsumed) + 1; },
    updateProgressBars() { if(!document.getElementById('carb-val')) return; const hours = this.state.totalTime / 3600; const planHours = (this.state.plannedDuration || 180) / 60; const goalCarbs = planHours * this.state.targetHourlyCarbs; const currentCarbTarget = hours * this.state.targetHourlyCarbs; document.getElementById('carb-val').innerText = Math.round(this.state.totalCarbsConsumed); document.getElementById('carb-pacer').innerText = Math.round(currentCarbTarget); document.getElementById('carb-progress-bar').style.width = `${Math.min((this.state.totalCarbsConsumed/goalCarbs)*100, 100)}%`; document.getElementById('carb-pacer-marker').style.left = `${Math.min((this.state.totalTime/(planHours*3600))*100, 100)}%`; const goalFluid = planHours * this.state.targetHourlyFluid; const currentFluidTarget = hours * this.state.targetHourlyFluid; document.getElementById('fluid-val').innerText = Math.round(this.state.totalFluidConsumed); document.getElementById('fluid-pacer').innerText = Math.round(currentFluidTarget); document.getElementById('fluid-progress-bar').style.width = `${Math.min((this.state.totalFluidConsumed/goalFluid)*100, 100)}%`; document.getElementById('fluid-pacer-marker').style.left = `${Math.min((this.state.totalTime/(planHours*3600))*100, 100)}%`; },
    updateCard(type, sec) { const el = document.getElementById(`timer-${type}`); if(!el) return; if (sec <= 0) { const overdue = Math.abs(sec); el.innerText = `+${FuelView.formatTime(overdue)}`; el.classList.remove('text-white'); el.classList.add('text-red-500', 'animate-pulse'); if (overdue % 10 === 0) this.playAlertTone(); } else { el.innerText = FuelView.formatTime(sec); el.classList.add('text-white'); el.classList.remove('text-red-500', 'animate-pulse'); } },
    readConfigInputs() { const getVal = (id) => { const el = document.getElementById(id); return el ? (parseInt(el.value) || 0) : 0; }; this.state.drinkInterval = getVal('input-drink-int') || 15; this.state.eatInterval = getVal('input-eat-int') || 45; this.state.carbsPerBottle = getVal('input-bottle-carbs') || 90; this.state.bottleVolume = getVal('input-bottle-vol') || 750; this.state.carbsPerFlask = getVal('input-flask-carbs') || 150; this.state.sipsPerBottle = getVal('input-sips-bottle') || 4; this.state.squeezesPerFlask = getVal('input-sqz-flask') || 4; this.state.targetHourlyCarbs = getVal('input-target-hourly') || 90; this.state.targetHourlyFluid = getVal('input-target-fluid') || 500; this.state.plannedDuration = getVal('input-planned-duration') || 180; },
    refreshUI() { document.getElementById('fuel-menu-container').innerHTML = FuelView.renderFuelButtons(this.state.fuelMenu); document.getElementById('fuel-library-editor').innerHTML = FuelView.renderFuelEditor(this.state.fuelMenu); },
    switchView(view) { document.getElementById('fuel-config-view').classList.toggle('hidden', view === 'active'); document.getElementById('fuel-active-view').classList.toggle('hidden', view === 'config'); document.getElementById('btn-fuel-reset').classList.toggle('hidden', view === 'config'); },
    updateBtnState(text, bgClass) { const btn = document.getElementById('btn-fuel-toggle'); btn.innerText = text; btn.className = `w-full py-4 rounded-xl font-bold text-xl uppercase tracking-widest text-white shadow-lg transition-colors ${bgClass}`; },
    enableNavigationGuards() { history.pushState(null, document.title, location.href); window.addEventListener('popstate', this.handlePopState); window.addEventListener('beforeunload', this.handleBeforeUnload); },
    disableNavigationGuards() { window.removeEventListener('popstate', this.handlePopState); window.removeEventListener('beforeunload', this.handleBeforeUnload); },
    handlePopState(event) { history.pushState(null, document.title, location.href); },
    handleBeforeUnload(e) { e.preventDefault(); e.returnValue = ''; }
};
