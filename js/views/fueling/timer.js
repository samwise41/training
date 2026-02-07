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
                { id: 'gel', label: 'Gel', carbs: 22, icon: 'fa-bolt' },
                { id: 'chews', label: 'Chews', carbs: 24, icon: 'fa-candy-cane' },
                { id: 'bar', label: 'Bar', carbs: 40, icon: 'fa-cookie-bite' }
            ];
        }
        
        // DEFAULT ALL SOLID FOOD AS UNSELECTED (AS REQUESTED)
        if (this.state.totalTime === 0 && this.state.fuelMenu.length === 0) {
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
        bind('btn-dismiss-help', () => this.toggleHelp(false));

        bind('btn-show-custom-fuel', () => {
            const area = document.getElementById('custom-fuel-input-area');
            area.classList.toggle('hidden');
        });

        bind('btn-log-custom', () => {
            const input = document.getElementById('input-custom-carbs');
            const val = parseInt(input.value) || 0;
            if(val > 0) { this.logFood(val, "Custom Entry"); input.value = ''; document.getElementById('custom-fuel-input-area').classList.add('hidden'); }
        });

        const menu = document.getElementById('fuel-menu-container');
        if(menu) menu.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-quick-fuel');
            if(btn) this.logFood(parseInt(btn.dataset.carbs), btn.dataset.name);
        });

        const log = document.getElementById('fuel-history-log');
        if(log) log.addEventListener('click', (e) => {
            const row = e.target.closest('.btn-delete-log');
            if(row) this.removeLogEntry(parseInt(row.dataset.index));
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

    // ... Keep all logic from previous logSip, logFlask, tick, updateDisplays, etc.
    // They are identical to previous working logic, just ensure they are included in your file.
    
    toggleHelp(show) {
        document.getElementById('fuel-help-modal').classList.toggle('hidden', !show);
    },

    refreshUI() {
        document.getElementById('fuel-menu-container').innerHTML = FuelView.renderFuelButtons(this.state.fuelMenu);
        document.getElementById('fuel-library-editor').innerHTML = FuelView.renderFuelEditor(this.state.fuelMenu);
    },

    switchView(view) {
        document.getElementById('fuel-config-view').classList.toggle('hidden', view === 'active');
        document.getElementById('fuel-active-view').classList.toggle('hidden', view === 'config');
        document.getElementById('btn-fuel-reset').classList.toggle('hidden', view === 'config');
    },

    updateBtnState(text, bgClass) {
        const btn = document.getElementById('btn-fuel-toggle');
        btn.innerText = text;
        btn.className = `w-full py-4 rounded-xl font-bold text-xl uppercase tracking-widest text-white shadow-lg transition-colors ${bgClass}`;
    }
};
