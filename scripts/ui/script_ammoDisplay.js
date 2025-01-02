
class AmmoDisplay {
    constructor(params = {}) {
        // Validate required parameters
        if (!params.uiContainer) {
            throw new Error('AmmoDisplay: uiContainer is required');
        }
        // Store dependencies
        this.uiContainer = params.uiContainer;

        // Default configuration
        this.config = {
            position: params.position || {
                left: '20px',
                bottom: '20px'
            },
            style: params.style || {
                padding: '10px',
                borderRadius: '5px'
            },
            iconSize: params.iconSize || {
                width: '24px',
                height: '24px'
            },
            textStyle: params.textStyle || {
                color: 'white',
                fontSize: '20px',
                fontFamily: 'Arial, sans-serif'
            },
            iconKey: params.iconKey || 'AMMO_ICON'
        };
        this.element = document.createElement('div');
        this.init();
    }
    init() {
        try {
            // Apply container styles
            Object.assign(this.element.style, {
                position: 'absolute',
                left: this.config.position.left,
                bottom: this.config.position.bottom,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                pointerEvents: 'none',
                ...this.config.style
            });
            // Create ammo icon
            const icon = document.createElement('img');
            const loadedImage = window.ImageLoader.getImage(this.config.iconKey);
            const imageSettings = window.ImageLoader.getImageSettings(this.config.iconKey);
            if (loadedImage) {
                icon.src = loadedImage.src;
                if (imageSettings && imageSettings.iconSize) {
                    icon.style.width = imageSettings.iconSize.width;
                    icon.style.height = imageSettings.iconSize.height;
                    icon.style.transform = 'translateY(-5px)';
                }
            } else {
                console.warn(`Image not found for ammo icon: ${this.config.iconKey}`);
                icon.src = '';
                icon.style.width = imageSettings?.iconSize?.width || '24px';
                icon.style.height = imageSettings?.iconSize?.height || '24px';
            }
            // Create ammo counter text
            const counter = document.createElement('span');
            Object.assign(counter.style, this.config.textStyle);
            counter.style.transform = 'translateY(-2px)';
            counter.textContent = '0 / 0';
            this.counterElement = counter;
            // Add elements to container
            this.element.appendChild(icon);
            this.element.appendChild(counter);
            // Add to UI container
            this.uiContainer.appendChild(this.element);
        } catch (error) {
            console.error('AmmoDisplay: Error initializing UI elements:', error);
            throw error;
        }
    }
    updateAmmo(current, max) {
        if (this.counterElement) {
            this.counterElement.textContent = `${current} / ${max}`;
        }
    }
    show() {
        this.element.style.display = 'flex';
    }
    hide() {
        this.element.style.display = 'none';
    }
}