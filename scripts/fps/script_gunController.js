
class GunController {
    constructor(params) {
        // Validate required parameters
        if (!params) {
            throw new Error('GunController: params object is required');
        }
        // Required dependencies
        const required = ['THREE', 'Ray', 'APP_SETTINGS'];
        for (const prop of required) {
            if (!params[prop]) {
                throw new Error(`GunController: ${prop} is required`);
            }
        }
        // Store dependencies
        this.THREE = params.THREE;
        this.Ray = params.Ray;
        this.settings = params.APP_SETTINGS;

        // Initialize properties
        this.mount = null;
        this.holder = null;
        this.currentGun = null;
        this.ray = new this.Ray({
            THREE: this.THREE,
            far: params.rayDistance || 1000
        });
        this.lastShotTime = 0;
        this.lastActionTime = 0;
        this.isReloading = false;
        this.queuedWeaponSwitch = null;
        this.states = {
            IDLE: 'IDLE',
            SHOOTING: 'SHOOTING',
            RELOADING: 'RELOADING',
            SWITCHING: 'SWITCHING'
        };
        this.currentState = this.states.IDLE;
        this.currentTime = 0;
        this.lastShotTime = 0;
        this.reloadStartTime = 0;
        this.reloadTime = 1000;
        this.cooldownTime = 250;
        this.wasMouseDown = false;

    }
    canShoot() {
        if (!this.currentGun) {
            return false;
        }
        const currentTime = Date.now();
        const timeSinceLastShot = currentTime - this.lastShotTime;
        return (
            this.currentState === this.states.IDLE &&
            this.currentGun.currentAmmo > 0 &&
            timeSinceLastShot >= this.cooldownTime &&
            !this.isReloading
        );
    }
    canSwitch() {
        const GunManager = window.GunManager;
        if (!this.holder || !GunManager) {
            return false;
        }
        const holderData = GunManager.getHolderData(this.holderType);
        return (
            this.currentState === this.states.IDLE &&
            holderData &&
            holderData.inventory.size > 1
        );
    }
    switchGun(newGunType) {
        if (this.currentState === this.states.SHOOTING || this.currentState === this.states.RELOADING) {
            this.queuedWeaponSwitch = newGunType;
            return true;
        }
        if (!this.canSwitch()) {
            return false;
        }
        this.currentState = this.states.SWITCHING;
        this.enterState(this.states.SWITCHING, newGunType);
        return true;
    }
    canReload() {
        return (
            !this.isReloading &&
            this.currentGun &&
            this.currentGun.currentAmmo < this.currentGun.maxAmmo &&
            this.currentState !== this.states.RELOADING
        );
    }
    isShootingComplete() {
        return Date.now() - this.lastShotTime >= this.cooldownTime;
    }
    isReloadComplete() {
        return Date.now() - this.reloadStartTime >= this.reloadTime;
    }
    enterState(state, gunType = null) {
        switch (state) {
            case this.states.SHOOTING:
                if (!this.currentGun) return;
                this.lastShotTime = Date.now();
                this.currentGun.currentAmmo--;
                this.isReloading = false;
                if (this.holderType === 'player') {
                    this.currentGun.playSound('shoot');
                    this.currentGun.startAnimation('recoil');
                }
                const hitInfo = this.performRaycast();
                if (hitInfo && ((this.holderType === 'player' && hitInfo.type === 'enemy') ||
                        (this.holderType === 'enemy' && hitInfo.type === 'player'))) {
                    this.currentGun.playSound('hit');
                }
                break;
            case this.states.RELOADING:
                if (!this.currentGun) return;
                this.reloadStartTime = Date.now();
                if (this.holderType === 'player') {
                    this.currentGun.playSound('reload');
                    this.currentGun.startAnimation('reload');
                }
                break;
            case this.states.SWITCHING:
                if (!gunType) {
                    this.exitState(this.states.SWITCHING);
                    return;
                }

                if (window.GunManager.setCurrentGun(this.holderType, gunType)) {
                    this.exitState(this.states.SWITCHING);
                }
                break;
        }
    }
    exitState(state) {
        if (!this.currentGun) return;
        switch (state) {
            case this.states.RELOADING:
                this.isReloading = false;
                this.currentGun.currentAmmo = this.currentGun.maxAmmo;
                this.currentGun.stopAnimation('reload');
                break;
            case this.states.SHOOTING:
                this.currentGun.stopAnimation('recoil');
                break;
            case this.states.SWITCHING:
                this.currentState = this.states.IDLE;
                break;
        }
    }
    shoot() {
        if (!this.currentGun || !this.canShoot()) return false;

        // Trigger shooting state
        this.currentState = this.states.SHOOTING;
        this.enterState(this.states.SHOOTING);
        this.lastActionTime = Date.now();
        return true;
    }
    reload() {
        if (!this.currentGun || !this.canReload()) return false;
        // Trigger reload state
        this.currentState = this.states.RELOADING;
        this.enterState(this.states.RELOADING);
        this.lastActionTime = Date.now();
        this.isReloading = true; // Set isReloading to true when reload starts
        return true;
    }
    executeStateAction() {
        if (!this.currentGun) return;
        switch (this.currentState) {
            case this.states.SHOOTING:
                this.currentGun.updateAnimation('recoil');
                break;
            case this.states.RELOADING:
                if (this.currentGun) {
                    this.currentGun.updateAnimation('reload');
                }
                break;
        }
    }
    setMount(mount) {
        console.log('GunController.setMount called with mount:', mount);
        if (!mount) {
            console.warn('GunController.setMount: Mount is undefined or null');
            return false;
        }
        this.mount = mount;
        console.log('GunController.setMount: Mount successfully set:', this.mount);
        return true;
    }
    getMount() {
        return this.mount;
    }
    setHolder(holder) {
        if (!holder) return false;
        this.holder = holder;
        // Determine holder type based on constructor name or explicit type
        this.holderType = holder.constructor.name === 'Player' ? 'player' : 'enemy';
        return true;
    }
    getHolder() {
        return this.holder;
    }
    setGun(gun) {
        if (!gun || !this.holderType) return false;
        // Request gun settings through GunManager
        const GunManager = window.GunManager;
        if (!GunManager) {
            console.error('GunController: GunManager not available');
            return false;
        }
        const holderData = GunManager.getHolderData(this.holderType);

        if (!holderData) return false;

        this.currentGun = gun;
        this.currentGun.holderType = this.holderType;

        if (this.mount) {
            this.mount.gunSettings = gun.settings;
        }

        const gunType = Object.keys(this.settings.guns).find(type =>
            this.settings.guns[type].model === gun.settings.model
        );

        if (gunType) {
            const gunSettings = this.settings.guns[gunType];
            this.reloadTime = gunSettings.timing.reload;
            this.cooldownTime = gunSettings.timing.cooldown;
        }

        if (this.mount) {
            gun.mount = this.mount;
        }

        return true;
    }
    getGun() {
        return this.currentGun;
    }
    assignMount(gun) {
        return this.setGun(gun);
    }
    update() {
        if (!this.currentGun) {
            console.debug('GunController.update: No current gun assigned');
            return;
        }
        if (!this.mount) {
            console.warn('GunController.update: No mount assigned');
            return;
        }
        this.currentTime = Date.now();
        let newState = this.currentState;
        switch (this.currentState) {
            case this.states.SHOOTING:
                if (this.isShootingComplete()) {
                    newState = this.states.IDLE;
                }
                break;
            case this.states.RELOADING:
                if (this.isReloadComplete()) {
                    this.currentGun.currentAmmo = this.currentGun.maxAmmo;
                    if (this.queuedWeaponSwitch) {
                        newState = this.states.SWITCHING;
                    } else {
                        newState = this.states.IDLE;
                    }
                }
                break;
            case this.states.IDLE:
                if (this.currentGun.currentAmmo <= 0 && this.canReload()) {
                    newState = this.states.RELOADING;
                }
                break;
        }
        if (newState !== this.currentState) {
            this.exitState(this.currentState);
            this.currentState = newState;
            if (this.currentState === this.states.SWITCHING && this.queuedWeaponSwitch) {
                this.enterState(this.currentState, this.queuedWeaponSwitch);
                this.queuedWeaponSwitch = null;
            } else {
                this.enterState(this.currentState);
            }
        }
        this.executeStateAction();
        // Update gun position and mount
        this.currentGun.updatePosition(this.currentGun.deltaTime);
        if (this.mount) {
            this.mount.update(this.currentGun.deltaTime);
        }
    }

    getRayDirection(position, holderType) {
        if (holderType === 'enemy' && window.CameraControl?.collisionBox) {
            const targetPos = window.CameraControl.collisionBox.mesh.position.clone();
            return targetPos.sub(position).normalize();
        }
        return this.mount.mountPoint.getWorldDirection(new this.THREE.Vector3());
    }
    checkIntersectionWithMesh(mesh, minDistance, holderType) {
        if (!mesh) return null;
        const intersection = this.ray.checkIntersection(mesh);
        if (intersection && intersection.distance < minDistance) {
            const hitInfo = {
                ...intersection,
                distance: intersection.distance,
                type: mesh.userData.type || mesh.constructor.name.toLowerCase(),
                holder: holderType
            };
            // Special handling for enemy hitbox
            if (holderType === 'player' && window.Enemy?.hitboxMesh === mesh) {
                hitInfo.type = 'enemy';
                hitInfo.target = window.Enemy;
            }
            return hitInfo;
        }
        return null;
    }
    handleHit(target, damage) {
        if (target && target.handleHit && this.currentGun) {
            target.handleHit(damage);
            this.currentGun.playSound('hit');
        }
    }
    getTargetMesh(holderType) {
        const targets = {
            player: {
                mesh: window.Enemy?.hitboxMesh, // Use hitbox instead of model
                condition: () => window.Enemy && !window.Enemy.isDead
            },
            enemy: {
                mesh: window.CameraControl?.collisionBox?.mesh,
                condition: () => true
            }
        };
        const target = targets[holderType];
        return target && target.condition() ? target.mesh : null;
    }
    performRaycast() {
        if (!this.mount || !this.holder) return null;
        const holderType = this.holderType
        const position = this.mount.mountPoint.getWorldPosition(new this.THREE.Vector3());
        const direction = this.getRayDirection(position, holderType);
        this.ray.update(position, direction);
        let closestIntersection = null;
        let minDistance = Infinity;
        // Check obstacles
        if (GameWorld.tilemap) {
            const obstacles = [...GameWorld.tilemap.getObstacles(), ...GameWorld.tilemap.getWalls()];
            for (const obstacle of obstacles) {
                if (obstacle.mesh) {
                    const intersection = this.checkIntersectionWithMesh(obstacle.mesh, minDistance, holderType);
                    if (intersection) {
                        minDistance = intersection.distance;
                        closestIntersection = intersection;
                    }
                }
            }
        }
        // Check target (enemy or player)
        const targetMesh = this.getTargetMesh(holderType);
        if (targetMesh) {
            const intersection = this.checkIntersectionWithMesh(targetMesh, minDistance, holderType);
            if (intersection) {
                closestIntersection = intersection;
                if (holderType === 'player' && intersection.target) {
                    this.handleHit(intersection.target, this.currentGun.settings.damage);
                }
            }
        }
        return closestIntersection;
    }
}