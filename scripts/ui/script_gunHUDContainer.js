
class GunHUDContainer {
    constructor(params = {}) {
        if (!params.uiContainer) {
            throw new Error('GunLayoutContainer: uiContainer is required');
        }
        this.uiContainer = params.uiContainer;
        this.element = document.createElement('div');
        this.init();
    }
    init() {
        Object.assign(this.element.style, {
            position: 'absolute',
            left: '20px',
            bottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            pointerEvents: 'none',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            padding: '8px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        });
        this.uiContainer.appendChild(this.element);
    }
    addChild(child) {
        if (child && child.element) {
            // Reset any absolute positioning from the child
            child.element.style.position = 'relative';
            child.element.style.left = 'auto';
            child.element.style.bottom = 'auto';
            this.element.appendChild(child.element);
        }
    }
    show() {
        this.element.style.display = 'flex';
    }
    hide() {
        this.element.style.display = 'none';
    }
}