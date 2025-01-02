class MuzzleFlashSettingsMenu {
    constructor(parentDiv) {
        this.parentDiv = parentDiv;
        this.menuContainer = null;
        this.visible = false;
        this.currentGunType = 'pistol';
        this.settings = {
            pistol: {
                size: APP_SETTINGS.guns.pistol.muzzleFlash.size || 0.05,
                duration: APP_SETTINGS.guns.pistol.muzzleFlash.duration || 20,
                color: APP_SETTINGS.guns.pistol.muzzleFlash.color || 0xffff00,
                offset: {
                    x: APP_SETTINGS.guns.pistol.muzzleFlash.offset?.x || 0,
                    y: APP_SETTINGS.guns.pistol.muzzleFlash.offset?.y || 0.1,
                    z: APP_SETTINGS.guns.pistol.muzzleFlash.offset?.z || 0
                }
            },
            smg: {
                size: APP_SETTINGS.guns.smg.muzzleFlash.size || 0.06,
                duration: APP_SETTINGS.guns.smg.muzzleFlash.duration || 25,
                color: APP_SETTINGS.guns.smg.muzzleFlash.color || 0xffff00,
                offset: {
                    x: APP_SETTINGS.guns.smg.muzzleFlash.offset?.x || 0,
                    y: APP_SETTINGS.guns.smg.muzzleFlash.offset?.y || 0.1,
                    z: APP_SETTINGS.guns.smg.muzzleFlash.offset?.z || 0
                }
            },
            sniper: {
                size: APP_SETTINGS.guns.sniper.muzzleFlash.size || 0.07,
                duration: APP_SETTINGS.guns.sniper.muzzleFlash.duration || 30,
                color: APP_SETTINGS.guns.sniper.muzzleFlash.color || 0xffff00,
                offset: {
                    x: APP_SETTINGS.guns.sniper.muzzleFlash.offset?.x || 0,
                    y: APP_SETTINGS.guns.sniper.muzzleFlash.offset?.y || 0.1,
                    z: APP_SETTINGS.guns.sniper.muzzleFlash.offset?.z || 0
                }
            }
        }
        this.createMenu();
        this.loadSettings();
    }
    createMenu() {
        this.menuContainer = document.createElement('div');
        this.menuContainer.style.position = 'absolute';
        this.menuContainer.style.top = '20px';
        this.menuContainer.style.right = '20px';
        this.menuContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.menuContainer.style.padding = '15px';
        this.menuContainer.style.pointerEvents = 'all';
        this.menuContainer.style.borderRadius = '5px';
        this.menuContainer.style.color = 'white';
        this.menuContainer.style.display = 'none';
        this.menuContainer.style.zIndex = '1000';
        const title = document.createElement('div');
        title.textContent = 'Muzzle Flash Settings (Press M to hide)';
        title.style.marginBottom = '10px';
        title.style.fontWeight = 'bold';
        this.menuContainer.appendChild(title);
        // Add gun selector dropdown
        this.createGunSelector();
        // Create settings controls
        this.createSettingsControls();
        this.parentDiv.appendChild(this.menuContainer);
    }
    createGunSelector() {
        const container = document.createElement('div');
        container.style.marginBottom = '15px';
        const label = document.createElement('div');
        label.textContent = 'Select Gun:';
        container.appendChild(label);
        const select = document.createElement('select');
        select.style.width = '100%';
        select.style.marginTop = '5px';
        select.style.padding = '5px';
        ['pistol', 'smg', 'sniper'].forEach(gunType => {
            const option = document.createElement('option');
            option.value = gunType;
            option.textContent = gunType.charAt(0).toUpperCase() + gunType.slice(1);
            select.appendChild(option);
        });
        select.addEventListener('change', (e) => {
            this.currentGunType = e.target.value;
            this.updateSettingsDisplay();
        });
        container.appendChild(select);
        this.menuContainer.appendChild(container);
    }
    createSettingsControls() {
        this.settingsContainer = document.createElement('div');
        this.menuContainer.appendChild(this.settingsContainer);
        this.updateSettingsDisplay();
    }
    updateSettingsDisplay() {
        this.settingsContainer.innerHTML = '';
        const currentSettings = this.settings[this.currentGunType];

        // Create a section for basic settings
        const basicSection = document.createElement('div');
        basicSection.style.marginBottom = '20px';
        const basicTitle = document.createElement('div');
        basicTitle.textContent = 'Basic Settings';
        basicTitle.style.fontWeight = 'bold';
        basicTitle.style.marginBottom = '10px';
        basicSection.appendChild(basicTitle);

        this.createSlider('Size', 'size', 0.01, 0.2, 0.01, currentSettings.size, basicSection);
        this.createSlider('Duration', 'duration', 10, 100, 5, currentSettings.duration, basicSection);
        this.createColorPicker('Color', 'color', currentSettings.color, basicSection);

        // Create a section for offset settings
        const offsetSection = document.createElement('div');
        offsetSection.style.marginTop = '20px';
        const offsetTitle = document.createElement('div');
        offsetTitle.textContent = 'Offset Settings';
        offsetTitle.style.fontWeight = 'bold';
        offsetTitle.style.marginBottom = '10px';
        offsetSection.appendChild(offsetTitle);

        // Create offset sliders
        this.createSlider('Offset X', 'offset.x', -0.5, 0.5, 0.01, currentSettings.offset.x, offsetSection);
        this.createSlider('Offset Y', 'offset.y', -0.5, 0.5, 0.01, currentSettings.offset.y, offsetSection);
        this.createSlider('Offset Z', 'offset.z', -0.5, 0.5, 0.01, currentSettings.offset.z, offsetSection);

        this.settingsContainer.appendChild(basicSection);
        this.settingsContainer.appendChild(offsetSection);
    }
    createSlider(label, property, min, max, step, value, parentElement) {
        const container = document.createElement('div');
        container.style.marginBottom = '10px';
        const labelElement = document.createElement('div');
        labelElement.textContent = `${label}: ${value}`;
        container.appendChild(labelElement);
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.value = value;
        slider.style.width = '200px';
        slider.addEventListener('input', (e) => {
            const newValue = parseFloat(e.target.value);
            labelElement.textContent = `${label}: ${newValue}`;
            // Ensure the settings object exists
            if (!this.settings[this.currentGunType]) {
                this.settings[this.currentGunType] = {};
            }
            // Handle nested properties (for offset)
            if (property.includes('.')) {
                const [parent, child] = property.split('.');
                if (!this.settings[this.currentGunType][parent]) {
                    this.settings[this.currentGunType][parent] = {};
                }
                this.settings[this.currentGunType][parent][child] = newValue;
            } else {
                // Update the setting
                this.settings[this.currentGunType][property] = newValue;
            }
            // Update muzzle flash and save settings
            this.updateMuzzleFlash();
            this.saveSettings();
        });
        container.appendChild(slider);
        parentElement.appendChild(container);
    }
    createColorPicker(label, property, value) {
        const container = document.createElement('div');
        container.style.marginBottom = '10px';
        const labelElement = document.createElement('div');
        labelElement.textContent = label;
        container.appendChild(labelElement);
        const colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.value = '#' + value.toString(16).padStart(6, '0');
        colorPicker.addEventListener('input', (e) => {
            const newValue = parseInt(e.target.value.substring(1), 16);
            this.settings[this.currentGunType][property] = newValue;
            this.updateMuzzleFlash();
            this.saveSettings();
        });
        container.appendChild(colorPicker);
        this.settingsContainer.appendChild(container);
    }
    updateMuzzleFlash() {
        const currentGun = window.GunManager?.getCurrentGun();
        const currentSettings = this.settings[this.currentGunType];

        // Update APP_SETTINGS first
        APP_SETTINGS.guns[this.currentGunType].muzzleFlash = {
            ...currentSettings,
            offset: APP_SETTINGS.guns[this.currentGunType].muzzleFlash.offset // Preserve offset
        };

        // Update current gun if it matches the type being modified
        if (currentGun && currentGun.muzzleFlash) {
            // Update muzzle flash settings while preserving offset
            Object.assign(currentGun.muzzleFlash.settings, {
                ...currentSettings,
                offset: currentGun.muzzleFlash.settings.offset
            });

            // Ensure the mesh is updated with new settings
            if (currentGun.muzzleFlash.mesh) {
                currentGun.muzzleFlash.mesh.material.color.setHex(currentSettings.color);
                currentGun.muzzleFlash.mesh.scale.setScalar(currentSettings.size);
            }
        }
    }
    toggle() {
        this.visible = !this.visible;
        this.menuContainer.style.display = this.visible ? 'block' : 'none';
    }
    saveSettings() {
        localStorage.setItem('muzzleFlashSettings', JSON.stringify(this.settings));
    }
    loadSettings() {
        const saved = localStorage.getItem('muzzleFlashSettings');
        if (saved) {
            const parsed = JSON.parse(saved);
            this.settings = parsed;
            Object.assign(APP_SETTINGS.muzzleFlash.defaultSettings, parsed[this.currentGunType]);
            this.updateMuzzleFlash();
        }
    }
}