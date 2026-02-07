import { DataManager } from './utils/data.js';
import { UI } from './utils/ui.js';

// Import Views
import { DashboardView } from './views/dashboard.js';
import { PlanView } from './views/plan.js';
import { TrendsView } from './views/trends.js';
import { GearView } from './views/gear.js';
import { ZonesView } from './views/zones.js';
import { FuelTimer } from './views/fueling/timer.js'; // The Fuel App

const App = {
    state: {
        currentView: 'dashboard',
        isNavOpen: false
    },

    async init() {
        // 1. Load Critical Data
        await DataManager.loadCriticalData();
        
        // 2. Setup Navigation
        this.renderNav();
        this.attachGlobalListeners();

        // 3. Load Default View
        this.navigate('dashboard');
        
        // 4. Load Background Data
        DataManager.loadBackgroundData();
    },

    renderNav() {
        const navItems = [
            { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
            { id: 'fueling',   label: 'Smart Fuel', icon: 'fa-gas-pump', highlight: true }, // Highlighted
            { id: 'plan',      label: 'Training Plan', icon: 'fa-calendar-days' },
            { id: 'trends',    label: 'Trends & Load', icon: 'fa-arrow-trend-up' },
            { id: 'zones',     label: 'Zones & Profile', icon: 'fa-heart-pulse' },
            { id: 'gear',      label: 'Gear Garage', icon: 'fa-bicycle' }
        ];

        const container = document.getElementById('nav-items');
        container.innerHTML = navItems.map(item => `
            <button class="nav-item w-full flex items-center gap-4 px-4 py-3 text-sm font-medium rounded-xl transition-all ${item.highlight ? 'text-emerald-400 bg-emerald-900/10 border border-emerald-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}" 
                data-target="${item.id}">
                <div class="w-6 text-center"><i class="fa-solid ${item.icon}"></i></div>
                <span>${item.label}</span>
            </button>
        `).join('');
    },

    attachGlobalListeners() {
        // Floating Nav Button Toggle
        const toggle = document.getElementById('nav-toggle');
        const nav = document.getElementById('side-nav');
        const overlay = document.getElementById('nav-overlay');

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

        // Nav Item Clicks
        document.getElementById('nav-items').addEventListener('click', (e) => {
            const btn = e.target.closest('.nav-item');
            if (!btn) return;
            
            // Visual Active State
            document.querySelectorAll('.nav-item').forEach(b => {
                b.classList.remove('bg-emerald-600', 'text-white', 'shadow-lg');
                b.classList.add('text-slate-400', 'hover:bg-slate-800');
            });
            btn.classList.remove('text-slate-400', 'hover:bg-slate-800');
            btn.classList.add('bg-emerald-600', 'text-white', 'shadow-lg');

            this.navigate(btn.dataset.target);
            toggleMenu(); // Close menu on select
        });
    },

    async navigate(viewId) {
        this.state.currentView = viewId;
        const container = document.getElementById('app-content');
        
        // Show Loading
        container.innerHTML = UI.loader();

        try {
            let html = '';
            
            // Route Logic
            switch(viewId) {
                case 'dashboard':
                    html = await DashboardView.render();
                    break;
                case 'fueling':
                    html = await FuelTimer.init();
                    break;
                case 'plan':
                    html = await PlanView.render();
                    break;
                case 'trends':
                    html = await TrendsView.render();
                    break;
                case 'zones':
                    html = await ZonesView.render();
                    break;
                case 'gear':
                    html = await GearView.render();
                    break;
                default:
                    html = '<div class="p-10 text-center text-slate-500">View not found</div>';
            }

            // Render
            container.innerHTML = html;

            // Post-Render Logic
            if (viewId === 'dashboard') DashboardView.afterRender();
            if (viewId === 'plan') PlanView.afterRender();
            if (viewId === 'fueling') FuelTimer.attachEvents();
            
        } catch (error) {
            console.error("Navigation Error:", error);
            container.innerHTML = `<div class="p-10 text-center text-red-500">Error loading view: ${error.message}</div>`;
        }
    }
};

// Start App
document.addEventListener('DOMContentLoaded', () => App.init());
