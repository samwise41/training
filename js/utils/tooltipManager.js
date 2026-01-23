// js/utils/tooltipManager.js

export const TooltipManager = {
    activeElement: null, // The DOM element that triggered the current tooltip
    containerId: 'app-tooltip',

    /**
     * @param {HTMLElement} triggerElement - The element clicked
     * @param {string} contentHtml - The HTML content to show
     * @param {MouseEvent|Object} evt - The click event (used for initial positioning fallback)
     */
    show(triggerElement, contentHtml, evt) {
        // 1. Toggle Logic: If clicking the same active element, close it.
        if (this.activeElement === triggerElement) {
            this.close();
            return;
        }

        // 2. Close any currently open tooltip (Singleton Rule)
        this.close();

        // 3. Set new active state
        this.activeElement = triggerElement;
        const tooltip = document.getElementById(this.containerId);
        if (!tooltip) return;

        // 4. Set Content & Make Visible (to calculate dimensions)
        tooltip.innerHTML = contentHtml;
        tooltip.classList.remove('opacity-0', 'pointer-events-none', 'hidden');
        tooltip.classList.add('opacity-100', 'pointer-events-auto');

        // 5. Smart Positioning
        this.updatePosition(triggerElement, tooltip, evt);
    },

    close() {
        const tooltip = document.getElementById(this.containerId);
        if (tooltip) {
            tooltip.classList.add('opacity-0', 'pointer-events-none');
            // Small delay to allow fade out before hiding completely if you want, 
            // but for "click" interactions, immediate feel is often better.
        }
        this.activeElement = null;
    },

    /**
     * Calculates position to ensure tooltip stays on screen
     * Prefers: Right of element, Centered vertically
     * Fallbacks: Left, Bottom, Top
     */
    updatePosition(trigger, tooltip, evt) {
        const rect = trigger.getBoundingClientRect();
        const ttRect = tooltip.getBoundingClientRect();
        const margin = 12; // Gap between target and tooltip

        // Default: Center Right
        let top = rect.top + (rect.height / 2) - (ttRect.height / 2);
        let left = rect.right + margin;

        // Check Right Edge Collision
        if (left + ttRect.width > window.innerWidth) {
            // Flip to Left
            left = rect.left - ttRect.width - margin;
        }

        // Check Bottom Edge Collision
        if (top + ttRect.height > window.innerHeight) {
            // Shift Up
            top = window.innerHeight - ttRect.height - margin;
        }

        // Check Top Edge Collision
        if (top < margin) {
            top = margin;
        }

        // Check Left Edge Collision (Mobile)
        if (left < margin) {
            // If it doesn't fit Left or Right, put it underneath
            left = margin;
            top = rect.bottom + margin;
        }

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    },

    // Global Listener to handle "Click Anywhere Else"
    initGlobalListener() {
        document.addEventListener('click', (e) => {
            // If click is inside the tooltip, ignore
            if (e.target.closest(`#${this.containerId}`)) return;

            // If click is on the active trigger, ignore (handled in show())
            if (this.activeElement && this.activeElement.contains(e.target)) return;

            // Otherwise, close
            if (this.activeElement) {
                this.close();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });
    }
};
