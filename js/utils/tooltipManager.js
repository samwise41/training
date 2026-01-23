// js/utils/tooltipManager.js

export const TooltipManager = {
    activeElement: null,
    containerId: 'app-tooltip',
    _isInit: false,

    /**
     * Shows the tooltip for a specific element.
     * RELIES ON: The trigger event (evt) must have called evt.stopPropagation() 
     * prevents the global window listener from immediately closing it.
     */
    show(triggerElement, contentHtml) {
        // 1. Toggle: If clicking the same active element, close it.
        if (this.activeElement === triggerElement) {
            this.close();
            return;
        }

        // 2. Close any currently open tooltip
        this.close();

        // 3. Set Active
        this.activeElement = triggerElement;
        
        const tooltip = document.getElementById(this.containerId);
        if (!tooltip) return;

        // 4. Render & Visible
        tooltip.innerHTML = contentHtml;
        tooltip.classList.remove('opacity-0', 'pointer-events-none', 'hidden');
        tooltip.classList.add('opacity-100', 'pointer-events-auto');

        // 5. Smart Position
        this.updatePosition(triggerElement, tooltip);
    },

    close() {
        const tooltip = document.getElementById(this.containerId);
        if (tooltip) {
            tooltip.classList.remove('opacity-100', 'pointer-events-auto');
            tooltip.classList.add('opacity-0', 'pointer-events-none');
        }
        this.activeElement = null;
    },

    updatePosition(trigger, tooltip) {
        // Safety check if element disappeared (e.g. re-render)
        if (!trigger || !trigger.isConnected) {
            this.close();
            return;
        }

        const rect = trigger.getBoundingClientRect();
        const ttRect = tooltip.getBoundingClientRect();
        
        const margin = 12;      
        const edgePadding = 20; // Safe distance from screen edge

        // --- Vertical Strategy ---
        // Default: Center vertically relative to target
        let top = rect.top + (rect.height / 2) - (ttRect.height / 2);

        // Floor Check (Bottom Edge)
        if (top + ttRect.height > window.innerHeight - edgePadding) {
            top = window.innerHeight - ttRect.height - edgePadding;
        }
        // Ceiling Check (Top Edge)
        if (top < edgePadding) {
            top = edgePadding;
        }

        // --- Horizontal Strategy ---
        // Default: Place to the Right
        let left = rect.right + margin;

        // Right Wall Check -> Flip Left
        if (left + ttRect.width > window.innerWidth - edgePadding) {
            left = rect.left - ttRect.width - margin;
        }

        // Left Wall Check (Mobile Fallback) -> Move Below
        if (left < edgePadding) {
            // Pin to left edge safe zone
            left = edgePadding;
            
            // Move it UNDER the element so we don't cover it
            top = rect.bottom + margin;

            // Re-verify Bottom Edge with new Y position
            if (top + ttRect.height > window.innerHeight - edgePadding) {
                // If it doesn't fit below, put it ABOVE
                top = rect.top - ttRect.height - margin; 
            }
        }

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    },

    initGlobalListener() {
        if (this._isInit) return;
        this._isInit = true;

        // --- THE CLEAN LOGIC ---
        // Since charts call stopPropagation(), this listener ONLY fires
        // when clicking background, headers, empty space, or other UI.
        window.addEventListener('click', (e) => {
            // 1. If nothing is open, do nothing.
            if (!this.activeElement) return;

            // 2. Allow interaction INSIDE the tooltip (e.g. selecting text)
            const tooltip = document.getElementById(this.containerId);
            if (tooltip && tooltip.contains(e.target)) return;

            // 3. Otherwise, Close.
            this.close();
        });

        // Handle Page Navigation (Hash Change)
        window.addEventListener('hashchange', () => {
            this.close();
        });

        // Handle Window Resize (Prevents floating ghosts)
        window.addEventListener('resize', () => {
            if (this.activeElement) this.close();
        });

        // Handle Escape Key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });
    }
};
