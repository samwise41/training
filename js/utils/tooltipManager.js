// js/utils/tooltipManager.js

export const TooltipManager = {
    activeElement: null,
    containerId: 'app-tooltip',
    _isInit: false,

    show(triggerElement, contentHtml, evt) {
        // 1. Toggle Logic: If clicking the active element, close it.
        if (this.activeElement === triggerElement) {
            this.close();
            return;
        }

        // 2. Force Close previous
        this.close();

        // 3. Set new active state
        this.activeElement = triggerElement;
        
        const tooltip = document.getElementById(this.containerId);
        if (!tooltip) return;

        // 4. Content & Visibility
        tooltip.innerHTML = contentHtml;
        tooltip.classList.remove('opacity-0', 'pointer-events-none', 'hidden');
        tooltip.classList.add('opacity-100', 'pointer-events-auto');

        // 5. Position
        this.updatePosition(triggerElement, tooltip);
    },

    close() {
        const tooltip = document.getElementById(this.containerId);
        if (tooltip) {
            tooltip.classList.add('opacity-0', 'pointer-events-none');
            // Remove interactive pointer events immediately
            tooltip.classList.remove('pointer-events-auto');
        }
        this.activeElement = null;
    },

    updatePosition(trigger, tooltip) {
        if (!trigger || !trigger.isConnected) {
            this.close();
            return;
        }

        const rect = trigger.getBoundingClientRect();
        const ttRect = tooltip.getBoundingClientRect();
        
        const margin = 12;      
        const edgePadding = 40; // High buffer to prevent edge crowding

        // --- Vertical ---
        let top = rect.top + (rect.height / 2) - (ttRect.height / 2);

        // Check Bottom
        if (top + ttRect.height > window.innerHeight - edgePadding) {
            top = window.innerHeight - ttRect.height - edgePadding;
        }
        // Check Top
        if (top < edgePadding) {
            top = edgePadding;
        }

        // --- Horizontal ---
        let left = rect.right + margin;

        // Flip to Left if overflowing Right
        if (left + ttRect.width > window.innerWidth - edgePadding) {
            left = rect.left - ttRect.width - margin;
        }

        // Mobile/Edge Fallback: If overflowing Left now
        if (left < edgePadding) {
            left = edgePadding;
            top = rect.bottom + margin;
            
            // Re-check bottom for the new position
            if (top + ttRect.height > window.innerHeight - edgePadding) {
                top = rect.top - ttRect.height - margin; 
            }
        }

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    },

    initGlobalListener() {
        if (this._isInit) return;
        this._isInit = true;

        // A. CAPTURE PHASE LISTENER (The Fix)
        // Passing 'true' as the 3rd argument ensures we catch the click 
        // BEFORE any chart element can stopPropagation()
        window.addEventListener('click', (e) => {
            // If nothing is open, ignore
            if (!this.activeElement) return;

            // Allow interaction inside the tooltip itself
            if (e.target.closest(`#${this.containerId}`)) return;

            // Allow interaction with the trigger (handled by toggle logic in show)
            if (this.activeElement.contains(e.target)) return;

            // Otherwise, CLOSE IT.
            this.close();
        }, true); // <--- Capture: True

        // B. Dismiss on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });

        // C. Dismiss on Resize
        window.addEventListener('resize', () => {
            if (this.activeElement) this.close();
        });

        // D. Dismiss on Navigation
        window.addEventListener('hashchange', () => {
            this.close();
        });
    }
};
