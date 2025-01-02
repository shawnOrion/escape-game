
class GunManager {
    constructor(params) {
        // Validate required parameters
        if (!params) {
            throw new Error('GunManager: params object is required');
        }
        // Required external dependencies
        const required = ['THREE', 'CANNON', 'scene', 'camera', 'settings', 'Gun'];
        for (const prop of required) {
            if (!params[prop]) {
                throw new Error(`GunManager: ${prop} is required`);
            }
        }
        // Store external dependencies
        this.THREE = params.THREE;
        this.CANNON = params.CANNON;
        this.Gun = params.Gun;
        this.scene = params.scene;
        this.camera = params.camera;
        this.settings = params.settings;
        // Initialize internal state
        this.holders = new Map(); // Will store HolderData objects
        this.holderGuns = new Map(); // Track guns loaded for each holder
        this.isInitialized = false;

        // Define holder data structure
        this.HolderData = class {
            constructor(holder) {
                this.holder = holder;
                this.currentGun = null;
                this.inventory = new Map(); // Maps gun type to Gun instance
                this.primaryGun = null;
                this.secondaryGun = null;
            }
        };
        this.loadingState = {
            inProgress: false,
            currentGunType: null,
            error: null
        };
    }
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            if (!this.settings.guns || Object.keys(this.settings.guns).length === 0) {
                throw new Error('GunManager: No gun settings found in settings object');
            }
            this.isInitialized = true;
        } catch (error) {
            throw error;
        }
    }
    validateGunType(gunType) {
        if (!this.settings.guns?.[gunType]) {
            throw new Error(`GunManager: Invalid gun type: ${gunType}`);
        }
        if (!window.ModelLoader) {
            throw new Error('GunManager: ModelLoader not available');
        }
    }
    async loadGun(gunType) {
        try {
            this.validateGunType(gunType);
            this.loadingState = {
                inProgress: true,
                currentGunType: gunType,
                error: null
            };
            const gunSettings = this.settings.guns[gunType];
            const model = await window.ModelLoader.loadModel(gunSettings.model);
            const gun = new this.Gun(this.scene, this.camera, model, gunSettings);
            return gun;
        } catch (error) {
            this.loadingState.error = error;
            throw error;
        } finally {
            this.loadingState.inProgress = false;
        }
    }
    assignHolder(holderName, holder) {
        if (!this.holders.has(holderName)) {
            const holderData = new this.HolderData(holder);
            this.holders.set(holderName, holderData);
        }
        return this.holders.get(holderName);
    }
    getHolderData(holderName) {
        return this.holders.get(holderName);
    }
    setCurrentGun(holderName, gunType) {
        const holderData = this.getHolderData(holderName);
        if (!holderData) return false;
        const gun = holderData.inventory.get(gunType);
        if (!gun) return false;
        // Hide current gun if exists
        if (holderData.currentGun) {
            holderData.currentGun.hide();
        }
        holderData.currentGun = gun;
        gun.show();
        // Update holder's gun controller
        if (holderData.holder.gunController) {
            holderData.holder.gunController.setGun(gun);
        }
        return true;
    }
    getCurrentGun(holderName) {
        const holderData = this.getHolderData(holderName);
        return holderData ? holderData.currentGun : null;
    }
    getGunFromInventory(holderName, gunType) {
        const holderData = this.getHolderData(holderName);
        return holderData ? holderData.inventory.get(gunType) : null;
    }
    addGunToInventory(holderName, gunType, gun) {
        const holderData = this.getHolderData(holderName);
        if (!holderData) return false;
        holderData.inventory.set(gunType, gun);
        return true;
    }
    removeGunFromInventory(holderName, gunType) {
        const holderData = this.getHolderData(holderName);
        if (!holderData) return false;
        const gun = holderData.inventory.get(gunType);
        if (!gun) return false;
        if (holderData.currentGun === gun) {
            holderData.currentGun = null;
        }
        return holderData.inventory.delete(gunType);
    }
    getInventory(holderName) {
        const holderData = this.getHolderData(holderName);
        return holderData ? holderData.inventory : null;
    }
    async preloadHolderGuns(holderName) {
        if (!this.settings.loadouts[holderName]) {
            throw new Error(`GunManager: No loadout found for holder: ${holderName}`);
        }
        const holderData = this.getHolderData(holderName);
        if (!holderData) {
            throw new Error(`Holder ${holderName} not registered`);
        }
        const loadout = this.settings.loadouts[holderName];
        const gunsToLoad = [loadout.primary, loadout.secondary].filter(Boolean);
        for (const gunType of gunsToLoad) {
            try {
                const gun = await this.loadGun(gunType);
                gun.hide(); // Hide initially
                gun.setupForHolder(holderName, this.settings.guns[gunType]);

                // Add to holder's inventory
                this.addGunToInventory(holderName, gunType, gun);

                // Set primary/secondary references
                if (gunType === loadout.primary) {
                    holderData.primaryGun = gun;
                } else if (gunType === loadout.secondary) {
                    holderData.secondaryGun = gun;
                }
            } catch (error) {
                console.error(`Failed to load gun ${gunType} for ${holderName}:`, error);
            }
        }
        return holderData.inventory;
    }
    async assignGunToHolder(holderName, gunType) {
        if (!this.isInitialized) {
            throw new Error('GunManager not initialized');
        }
        const holderData = this.getHolderData(holderName);
        if (!holderData) {
            throw new Error(`Holder ${holderName} not found`);
        }
        try {
            const gun = this.getGunFromInventory(holderName, gunType);
            if (!gun) {
                throw new Error(`Gun ${gunType} not in inventory for holder ${holderName}`);
            }
            if (this.setCurrentGun(holderName, gunType)) {
                return gun;
            } else {
                throw new Error(`Failed to set current gun ${gunType} for holder ${holderName}`);
            }
        } catch (error) {
            throw error;
        }
    }
    getGunForHolder(holderName) {
        return this.getCurrentGun(holderName);
    }

    update(deltaTime) {
        for (const [holderName, holderData] of this.holders) {
            if (holderData.currentGun) {
                holderData.currentGun.update(deltaTime);
            }
        }
    }
}