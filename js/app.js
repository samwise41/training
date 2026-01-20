// js/app.js

(async function initApp() {
    console.log("🚀 Booting App (Dashboard Only Mode)...");

    const cacheBuster = Date.now();
    
    // Helper for safe imports
    const safeImport = async (path, name) => {
        try {
            return await import(`${path}?t=${cacheBuster}`);
        } catch (e) {
            console.error(`⚠️ Failed to load module: ${name}`, e);
            return null;
        }
    };

    // --- 1. IMPORT ONLY DASHBOARD ---
    const dashMod = await safeImport('./views/dashboard/index.js', 'Dashboard');
    const { renderDashboard } = dashMod || { renderDashboard: () => `<div class="p-4 text-red-500">Error: Dashboard module failed to load.</div>` };

    // --- 2. APP STATE ---
    const App = {
        plannedData: [],
        trainingLogData: [],

        async init() {
            await this.loadData();
            this.render();
        },

        async loadData() {
            try {
                console.log("📡 Fetching JSON data...");
                
                // Fetch ONLY the necessary JSON files
                const [plannedRes, logRes] = await Promise.all([
                    fetch('./data/planned.json'),
                    fetch('./data/training_log.json')
                ]);

                if (!plannedRes.ok || !logRes.ok) {
                    throw new Error(`HTTP Error: Planned: ${plannedRes.status}, Log: ${logRes.status}`);
                }

                this.plannedData = await plannedRes.json();
                this.trainingLogData = await logRes.json();

                console.log("✅ Data Loaded Successfully:", { 
                    plannedItems: this.plannedData.length, 
                    logItems: this.trainingLogData.length 
                });

            } catch (err) {
                console.error("❌ Data Load Error:", err);
                document.getElementById('main-content').innerHTML = `
                    <div class="p-10 text-center">
                        <div class="bg-red-500/10 border border-red-500/50 rounded-lg p-6 inline-block text-left max-w-lg">
                            <h2 class="text-xl font-bold text-red-400 mb-2">⚠️ Data Loading Failed</h2>
                            <p class="text-sm text-slate-400 mb-4">Could not load the required JSON files.</p>
                            <pre class="bg-slate-950 p-4 rounded text-xs text-red-300 font-mono overflow-auto">${err.message}</pre>
                        </div>
                    </div>`;
            }
        },

        render() {
            const content = document.getElementById('main-content');
            
            // Stats Bar (Simple Version)
            const totalMins = this.trainingLogData.reduce((acc, d) => acc + (parseFloat(d.actualDuration) || 0), 0);
            const totalHrs = Math.floor(totalMins / 60);
            
            const statsHtml = `
                <div class="bg-slate-800 border-b border-slate-700 px-6 py-3 flex justify-between items-center mb-6 rounded-lg shadow-sm">
                    <span class="text-slate-400 text-xs uppercase tracking-widest font-bold">Training Database</span>
                    <div class="flex gap-4">
                        <span class="text-xs text-slate-400 font-mono"><strong class="text-white">${this.trainingLogData.length}</strong> Activities</span>
                        <span class="text-xs text-slate-400 font-mono"><strong class="text-white">${totalHrs}</strong> Hours</span>
                    </div>
                </div>
            `;

            try {
                // Pass the raw JSON arrays to the dashboard renderer
                const dashboardHtml = renderDashboard(this.plannedData, this.trainingLogData);
                content.innerHTML = statsHtml + dashboardHtml;
            } catch (err) {
                console.error("Render Crash:", err);
                content.innerHTML = `<p class="text-red-500 p-4">Error Rendering Dashboard: ${err.message}</p>`;
            }
        }
    };

    // Mobile Menu Logic
    const menuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (menuBtn && sidebar && overlay) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.remove('hidden', '-translate-x-full');
            overlay.classList.remove('hidden');
        });
        
        overlay.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        });
    }

    // Initialize
    window.App = App;
    App.init();

})();
