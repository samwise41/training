// js/app.js

(async function initApp() {
    console.log("🚀 Booting App (Lazy Mode)...");
    const cacheBuster = Date.now();
    
    const safeImport = async (path, name) => {
        try { return await import(`${path}?t=${cacheBuster}`); } 
        catch (e) { console.error(`❌ Failed to load ${name}`, e); return null; }
    };

    // Load Modules
    const [
        dashMod, trendsMod, gearMod, zonesMod, ftpMod, metricsMod, readinessMod, analyzerMod, 
        tooltipMod, uiMod, dataMod, formatMod 
    ] = await Promise.all([
        safeImport('./views/dashboard/index.js', 'Dashboard'),
        safeImport('./views/trends/index.js', 'Trends'),
        safeImport('./views/gear/index.js', 'Gear'),
        safeImport('./views/zones/index.js', 'Zones'),
        safeImport('./views/ftp/index.js', 'FTP'),
        safeImport('./views/metrics/index.js', 'Metrics'),
        safeImport('./views/readiness/index.js', 'Readiness'),
        safeImport('./views/logbook/analyzer.js', 'Analyzer'),
        safeImport('./utils/tooltipManager.js', 'TooltipManager'),
        safeImport('./utils/ui.js', 'UI'),
        safeImport('./utils/data.js', 'DataManager'),
        safeImport('./utils/formatting.js', 'Formatters')
    ]);

    // Setup Utils
    if (tooltipMod?.TooltipManager?.initGlobalListener) {
        tooltipMod.TooltipManager.initGlobalListener();
        window.TooltipManager = tooltipMod.TooltipManager; 
    }
    if (uiMod?.UI?.init) uiMod.UI.init();
    
    const DataManager = dataMod?.DataManager;
    const Formatters = formatMod?.Formatters;

    // App State
    const App = {
        // Data Containers
        planMd: "", rawLogData: [], readinessData: null, // Critical
        gearData: null, garminData: [], profileData: null, trendsData: null, // Background

        weather: { current: null, hourly: null, code: 0 }, 

        async init() {
            // 1. FAST BOOT: Load critical data only
            await this.loadCritical();
            
            // 2. Setup UI
            this.setupNavigation();
            this.fetchWeather(); 
            this.handleRouting();

            // 3. LAZY LOAD: Fetch the rest in background
            this.loadBackground();
        },

        async loadCritical() {
            if (DataManager) {
                const critical = await DataManager.loadCriticalData();
                Object.assign(this, critical);
            }
        },

        async loadBackground() {
            if (DataManager) {
                const bg = await DataManager.loadBackgroundData();
                Object.assign(this, bg);
                // Re-render if the user is already on a tab that needs this data
                const current = window.location.hash.replace('#', '');
                if (['gear','zones','ftp','trends','roadmap'].includes(current)) {
                    this.renderCurrentView(current);
                }
            }
        },

        handleRouting() {
            const hashView = window.location.hash.replace('#', '');
            const initialView = hashView || localStorage.getItem('currentView') || 'dashboard';
            if (window.location.hash !== `#${initialView}`) window.location.hash = initialView; 
            else this.renderCurrentView(initialView);
        },

        async fetchWeather() {
            try {
                const locRes = await fetch('https://ipapi.co/json/');
                const locData = await locRes.json();
                if (locData.latitude) {
                    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${locData.latitude}&longitude=${locData.longitude}&current_weather=true&hourly=temperature_2m,weathercode&temperature_unit=fahrenheit&forecast_days=1`);
                    const weatherData = await weatherRes.json();
                    this.weather.current = Math.round(weatherData.current_weather.temperature);
                    this.weather.hourly = weatherData.hourly || null;
                    this.weather.code = weatherData.current_weather.weathercode;
                    this.updateHeaderUI();
                }
            } catch (e) { console.error("Weather unavailable", e); }
        },

        updateHeaderUI(viewName) {
            const titles = { dashboard: 'Weekly Schedule', trends: 'Trends & KPIs', plan: 'Logbook Analysis', gear: 'Gear Choice', zones: 'Training Zones', ftp: 'Performance Profile', readiness: 'Race Readiness', metrics: 'Performance Metrics' };
            if (viewName) {
                const titleEl = document.getElementById('header-title-dynamic');
                if (titleEl) titleEl.innerText = titles[viewName] || 'Dashboard';
            }
            if (this.weather.current !== null && Formatters) {
                const condition = Formatters.getWeatherInfo(this.weather.code);
                const wInfo = document.getElementById('weather-info');
                const wIcon = document.getElementById('weather-icon-top');
                if (wInfo) wInfo.innerText = `${this.weather.current}°F • ${condition[0]}`;
                if (wIcon) wIcon.innerText = condition[1];
            }
        },

        setupNavigation() {
            const menuBtn = document.getElementById('mobile-menu-btn');
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            const btnClose = document.getElementById('btn-sidebar-close'); 
            const toggleSidebar = () => { sidebar.classList.toggle('sidebar-closed'); sidebar.classList.toggle('sidebar-open'); overlay.classList.toggle('hidden'); };

            window.addEventListener('hashchange', () => this.renderCurrentView(window.location.hash.replace('#', '')));

            document.querySelectorAll('.nav-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    window.location.hash = e.currentTarget.dataset.view; 
                    if (window.innerWidth < 1024 && !overlay.classList.contains('hidden')) toggleSidebar();
                });
            });

            if (menuBtn) menuBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(); });
            if (overlay) overlay.addEventListener('click', toggleSidebar);
            if (btnClose) btnClose.addEventListener('click', toggleSidebar);
        },

        renderCurrentView(view) {
            localStorage.setItem('currentView', view);
            this.updateHeaderUI(view);

            document.querySelectorAll('.nav-item').forEach(b => {
                if (b.dataset.view === view) {
                    b.classList.remove('text-slate-400', 'border-transparent');
                    b.classList.add('bg-slate-800', 'text-white', 'border-slate-600');
                } else {
                    b.classList.remove('bg-slate-800', 'text-white', 'border-slate-600');
                    b.classList.add('text-slate-400', 'border-transparent');
                }
            });

            const content = document.getElementById('main-content');
            content.classList.add('opacity-0');
            
            setTimeout(async () => {
                content.innerHTML = '';
                const render = {
                    dashboard: () => dashMod?.renderDashboard(this.plannedData, this.rawLogData, this.planMd, this.readinessData),
                    trends: () => trendsMod?.renderTrends(null, this.trendsData).html,
                    metrics: () => metricsMod?.renderMetrics(this.rawLogData),
                    readiness: () => readinessMod?.renderReadiness(this.readinessData),
                    ftp: () => ftpMod?.renderFTP(this.profileData),
                    zones: async () => await zonesMod?.renderZonesTab(this.profileData),
                    gear: () => gearMod?.renderGear(this.gearData, this.weather.current, this.weather.hourly),
                    plan: () => analyzerMod?.renderAnalyzer(this.rawLogData)
                };

                try {
                    if (render[view]) {
                        content.innerHTML = await render[view]();
                    } else {
                        content.innerHTML = `<div class="p-10 text-center text-slate-500">View not found: ${view}</div>`;
                    }
                } catch (e) {
                    console.error(`Render Error (${view}):`, e);
                    content.innerHTML = `<div class="p-10 text-red-500">Render Error: ${e.message}</div>`;
                }
                content.classList.remove('opacity-0');
            }, 150);
        }
    };

    window.App = App;
    App.init();
})();
