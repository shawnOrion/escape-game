
class GunLoadoutPanel {
    constructor(params = {}) {
        if (!params.uiContainer) {
            throw new Error('WeaponDisplay: uiContainer is required');
        }
        if (!params.settings) {
            throw new Error('WeaponDisplay: settings is required');
        }
        this.uiContainer = params.uiContainer;
        this.settings = params.settings;
        this.config = {
            position: {
                left: '20px',
                bottom: '60px' // Position above AmmoDisplay
            },
            style: {
                padding: '10px',
                borderRadius: '5px',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
            },
            weaponStyle: {
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '5px',
                color: 'white',
                fontSize: '16px',
                fontFamily: 'Arial, sans-serif'
            }
        };
        this.element = document.createElement('div');
        this.init();
    }
    init() {
        Object.assign(this.element.style, {
            position: 'absolute',
            left: this.config.position.left,
            bottom: this.config.position.bottom,
            pointerEvents: 'none',
            ...this.config.style
        });
        const loadout = this.settings.loadouts.player;
        const weapons = [{
            key: '1',
            type: loadout.primary
        }, {
            key: '2',
            type: loadout.secondary
        }];
        this.weaponElements = new Map();
        weapons.forEach(weapon => {
            if (weapon.type) {
                const weaponElement = this.createWeaponElement(weapon.key, weapon.type);
                this.weaponElements.set(weapon.type, weaponElement);
                this.element.appendChild(weaponElement);
            }
        });
        this.uiContainer.appendChild(this.element);
        this.currentGunType = null;
    }
    createWeaponElement(key, type) {
        const container = document.createElement('div');
        container.dataset.weaponType = type;
        Object.assign(container.style, {
            ...this.config.weaponStyle,
            transition: 'opacity 0.3s ease'
        });
        // Keybind
        const keybind = document.createElement('span');
        keybind.textContent = `${key} `;
        keybind.style.minWidth = '25px';
        // Weapon icon
        const iconKey = `${type.toUpperCase()}_ICON`;
        const icon = document.createElement('img');
        // Get the loaded and transformed image from ImageLoader
        const loadedImage = window.ImageLoader.getImage(iconKey);
        const imageSettings = window.ImageLoader.getImageSettings(iconKey);
        if (loadedImage) {
            icon.src = loadedImage.src;
            // Apply icon size from settings
            if (imageSettings && imageSettings.iconSize) {
                icon.style.width = imageSettings.iconSize.width;
                icon.style.height = imageSettings.iconSize.height;
            }
            if (imageSettings && imageSettings.flipX) {
                icon.style.transform = 'scaleX(-1)';
            }
        } else {
            console.warn(`Image not found for weapon type: ${type}`);
            icon.src = ''; // Set empty source or default image
            Object.assign(icon.style, this.config.iconSize);
        }
        container.appendChild(keybind);
        container.appendChild(icon);
        return container;
    }
    show() {
        this.element.style.display = 'flex';
    }
    hide() {
        this.element.style.display = 'none';
    }
    getCurrentGunType() {
        if (window.GunManager) {
            const gun = window.GunManager.getCurrentGun('player');
            if (gun) {
                // Find gun type by comparing model settings
                return Object.keys(this.settings.guns).find(type =>
                    this.settings.guns[type].model === gun.settings.model
                );
            }
        }
        return null;
    }
    update() {
        const newGunType = this.getCurrentGunType();
        if (newGunType !== this.currentGunType) {
            this.currentGunType = newGunType;
            this.weaponElements.forEach((element, type) => {
                element.style.opacity = type === this.currentGunType ? '1' : '0.4';
            });
        }
    }
}