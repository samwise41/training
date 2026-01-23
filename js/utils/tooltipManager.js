// js/utils/tooltipManager.js

export const TooltipManager = {
    activeElement: null,
    containerId: 'app-tooltip',

    show(triggerElement, contentHtml, evt) {
        // Toggle Logic: If clicking the same element, close it.
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
        
        // --- SETTINGS ---
        const margin = 12;      // Distance from the target element
        const edgePadding = 20; // Safe zone from screen edges (Buffer)

        // --- 1. Vertical Positioning ---
        // Default: Center vertically relative to target
        let top = rect.top + (rect.height / 2) - (ttRect.height / 2);

        // Check Bottom Edge
        if (top + ttRect.height > window.innerHeight - edgePadding) {
            top = window.innerHeight - ttRect.height - edgePadding;
        }
        // Check Top Edge
        if (top < edgePadding) {
            top = edgePadding;
        }

        // --- 2. Horizontal Positioning ---
        // Default: Place to the Right
        let left = rect.right + margin;

        // Check Right Edge Collision -> Flip to Left
        if (left + ttRect.width > window.innerWidth - edgePadding) {
            left = rect.left - ttRect.width - margin;
        }

        // --- 3. Mobile / Narrow Screen Fallback ---
        // If placing left causes Left Edge Collision...
        if (left < edgePadding) {
            // Force "Floating Mode":
            // 1. Pin to left edge (with buffer)
            left = edgePadding;
            
            // 2. Move BELOW the element to avoid covering it
            top = rect.bottom + margin;

            // 3. Re-check Bottom Edge for this new position
            if (top + ttRect.height > window.innerHeight - edgePadding) {
                // If no room below, move ABOVE
                top = rect.top - ttRect.height - margin;
            }
        }

        // --- 4. Final Safety Clamp (The Buffer Guarantee) ---
        // Ensure the Right edge of the tooltip never exceeds the window width - padding
        const maxLeft = window.innerWidth - ttRect.width - edgePadding;
        if (left > maxLeft) {
            left = maxLeft;
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
