import { DataManager } from './utils/data.js';
// We don't import Views here anymore to prevent crashes

const App = {
    state: {
        currentView: 'fueling', // Default to Fueling
        isNavOpen: false
    },

    async init() {
        // 1. Setup Navigation (Load shell immediately)
        this.renderNav();
        this.attachGlobalListeners();

        // 2. Load the Default View
        await this.navigate(this.state.currentView);
        
        // 3. Load Data in background (if data.js exists)
        if(DataManager && DataManager.loadCriticalData) {
            try { await DataManager.loadCriticalData(); } catch(e) { console.warn("Data load issue:", e); }
        }
    },

    renderNav() {
        const navItems = [
            { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
            { id: 'fueling',   label: 'Smart Fuel', icon: 'fa-gas-pump' },
            { id: 'plan',      label: 'Training Plan', icon: 'fa-calendar-days' },
            { id: 'trends',    label: 'Trends & Load', icon: 'fa-arrow-trend-up' },
            { id: 'zones',     label: 'Zones & Profile', icon: 'fa-heart-pulse' },
            { id: 'gear',      label: 'Gear Garage', icon: 'fa-bicycle' }
        ];

        const container = document.getElementById('nav-items');
        if(!container) return;

        container.innerHTML = navItems.map(item => `
            <button class="nav-item w-full flex items-center gap-4 px-4 py-3 text-sm font-medium rounded-xl transition-all ${item.id === this.state.currentView ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}" 
                data-target="${item.id}">
                <div class="w-6 text-center"><i class="fa-solid ${item.icon}"></i></div>
                <span>${item.label}</span>
            </button>
        `).join('');
    },

    attachGlobalListeners() {
        const toggle = document.getElementById('nav-toggle');
        const nav = document.getElementById('side-nav');
        const overlay = document.getElementById('nav-overlay');

        if(!toggle || !nav || !overlay) return;

        const toggleMenu = () => {
            this.state.isNavOpen = !this.state.isNavOpen;
            if (this.state.isNavOpen) {
                nav.classList.remove('-translate-x-full');
                overlay.classList.remove('hidden');
                setTimeout(() => overlay.classList.remove('opacity-0'), 10);
            } else {
                nav.classList.add('-translate-x-full');
                overlay.classList.add('opacity-0');
                setTimeout(() => overlay.classList.add('hidden'), 300);
            }
        };

        toggle.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);

        const list = document.getElementById('nav-items');
        if(list) {
            list.addEventListener('click', (e) => {
                const btn = e.target.closest('.nav-item');
                if (!btn) return;
                
                // Update UI classes
                document.querySelectorAll('.nav-item').forEach(b => {
                    b.classList.remove('bg-emerald-600', 'text-white', 'shadow-lg');
                    b.classList.add('text-slate-400', 'hover:bg-slate-800');
                });
                btn.classList.remove('text-slate-400', 'hover:bg-slate-800');
                btn.classList.add('bg-emerald-600', 'text-white', 'shadow-lg');

                this.navigate(btn.dataset.target);
                toggleMenu();
            });
        }
    },

    async navigate(viewId) {
        this.state.currentView = viewId;
        const container = document.getElementById('app-content');
        
        // Show Loading Spinner
        container.innerHTML = `
            <div class="flex items-center justify-center h-full text-emerald-500">
                <i class="fa-solid fa-circle-notch fa-spin text-3xl"></i>
            </div>`;

        try {
            let html = '';
            
            // DYNAMIC IMPORTS: This prevents the whole app from crashing if one file is missing
            switch(viewId) {
                case 'dashboard':
                    // Try to load dashboard, fallback if missing
                    try {
                        const mod = await import('./views/dashboard.js');
                        html = await mod.DashboardView.render();
                        setTimeout(() => mod.DashboardView.afterRender && mod.DashboardView.afterRender(), 0);
                    } catch(e) { html = this.errorHtml('Dashboard', e); }
                    break;

                case 'fueling':
                    try {
                        const mod = await import('./views/fueling/timer.js');
                        html = await mod.FuelTimer.init();
                        setTimeout(() => mod.FuelTimer.attachEvents && mod.FuelTimer.attachEvents(), 100);
                    } catch(e) { html = this.errorHtml('Smart Fuel', e); }
                    break;
                
                // You can add other cases here (plan, trends, etc) using the same pattern
                
                default:
                    html = `<div class="p-10 text-center text-slate-500 mt-20">
                        <i class="fa-solid fa-person-digging text-4xl mb-4 opacity-50"></i><br>
                        View under construction
                    </div>`;
            }

            container.innerHTML = html;

        } catch (error) {
            console.error("Navigation Error:", error);
            container.innerHTML = this.errorHtml('Navigation', error);
        }
    },

    errorHtml(name, e) {
        return `
            <div class="p-8 mt-20 text-center">
                <div class="inline-block p-4 rounded-full bg-red-900/20 text-red-500 mb-4">
                    <i class="fa-solid fa-bug text-3xl"></i>
                </div>
                <h2 class="text-xl font-bold text-white mb-2">Error Loading ${name}</h2>
                <p class="text-slate-400 text-sm mb-4">The file might be missing or has a syntax error.</p>
                <code class="block bg-slate-900 p-4 rounded text-left text-xs font-mono text-red-400 overflow-x-auto">
                    ${e.message}
                </code>
            </div>
        `;
    }
};

// Start App
document.addEventListener('DOMContentLoaded', () => App.init());
