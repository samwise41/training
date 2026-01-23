const TooltipManager = {
    activeElement: null, // Track the DOM element currently triggering the tooltip

    // Standardize the show function
    show(triggerElement, contentHtml, x, y) {
        // 1. Close existing
        this.close();

        // 2. Set Active
        this.activeElement = triggerElement;

        // 3. Render content into the single global #app-tooltip container
        const tooltip = document.getElementById('app-tooltip');
        tooltip.innerHTML = contentHtml;
        tooltip.classList.remove('hidden');

        // 4. Calculate Smart Position
        // Logic to check window.innerWidth vs x, window.innerHeight vs y
        // Apply style.left / style.top
    },

    close() {
        const tooltip = document.getElementById('app-tooltip');
        if (tooltip) tooltip.classList.add('hidden');
        this.activeElement = null;
    },

    // Global listener to attach to document
    handleGlobalClick(e) {
        // If click is NOT inside tooltip AND NOT on the active trigger element
        if (!e.target.closest('#app-tooltip') && e.target !== this.activeElement) {
            this.close();
        }
    }
};
