// js/utils/tooltipManager.js

export const TooltipManager = {
    activeElement: null,
    containerId: 'app-tooltip',

    show(triggerElement, contentHtml, evt) {
        if (this.activeElement === triggerElement) {
            this.close();
            return;
        }

        this.close();
        this.activeElement = triggerElement;
        
        const tooltip = document.getElementById(this.containerId);
        if (!tooltip) return;

        tooltip.innerHTML = contentHtml;
        tooltip.classList.remove('opacity-0', 'pointer-events-none', 'hidden');
        tooltip.classList.add('opacity-100', 'pointer-events-auto');

        this.updatePosition(triggerElement, tooltip);
    },

    close() {
        const tooltip = document.getElementById(this.containerId);
        if (tooltip) {
            tooltip.classList.add('opacity-0', 'pointer-events-none');
        }
        this.activeElement = null;
    },

    updatePosition(trigger, tooltip) {
        const rect = trigger.getBoundingClientRect();
        const ttRect = tooltip.getBoundingClientRect();
        
        // Settings
        const margin = 12; // Space between element and tooltip
        const edgePadding = 10; // Minimum distance from screen edge

        // Default: Right of element, centered vertically
        let top = rect.top + (rect.height / 2) - (ttRect.height / 2);
        let left = rect.right + margin;

        // 1. Horizontal Checks
        // If it goes off the RIGHT edge...
        if (left + ttRect.width > window.innerWidth - edgePadding) {
            // Flip to LEFT
            left = rect.left - ttRect.width - margin;
        }

        // If it now goes off the LEFT edge (mobile)...
        if (left < edgePadding) {
            // Force it to stick to the left edge with padding
            left = edgePadding;
            // And move it BELOW the element so it doesn't cover it
            top = rect.bottom + margin;
        }

        // 2. Vertical Checks
        // If it goes off the BOTTOM...
        if (top + ttRect.height > window.innerHeight - edgePadding) {
            // Pin to bottom edge
            top = window.innerHeight - ttRect.height - edgePadding;
        }

        // If it goes off the TOP...
        if (top < edgePadding) {
            top = edgePadding;
        }

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    },

    initGlobalListener() {
        document.addEventListener('click', (e) => {
            if (e.target.closest(`#${this.containerId}`)) return;
            if (this.activeElement && this.activeElement.contains(e.target)) return;
            if (this.activeElement) this.close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });
    }
};
