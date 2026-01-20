// js/app.js
(async function init() {
    const content = document.getElementById('main-content');
    try {
        // Dynamic Import to load Dashboard
        const dash = await import('./views/dashboard/index.js?t=' + Date.now());
        
        // Fetch Data
        const [planRes, logRes, plannedRes] = await Promise.all([
            fetch('./endurance_plan.md'),
            fetch('./data/training_log.json'),
            fetch('./data/planned.json')
        ]);

        const planMd = await planRes.text();
        const logData = await logRes.json();
        const plannedData = await plannedRes.json();

        // Render Dashboard
        content.innerHTML = dash.renderDashboard(plannedData, logData, planMd);

    } catch (e) {
        content.innerHTML = `<div class="p-10 text-red-500">Error: ${e.message}</div>`;
        console.error(e);
    }
})();
