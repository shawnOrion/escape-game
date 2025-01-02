// todo later: expose dependencies like THREE js to the Gun; upload the script to rosebud project 

class Gun {
    static nextId = 1;
    constructor(scene, camera, model, settings) {
        this.id = Gun.nextId++;
        this.scene = scene;
        this.camera = camera;
        this.model = model;
        this.mount = null;
        this.deltaTime = 0;
        this.settings = settings;

        // Initialize animation system from settings
        this.animations = {
            recoil: {
                active: false,
                progress: 0,
                startTime: 0,
                currentOffset: new THREE.Vector3(),
                settings: settings.animations?.recoil || {}
            },
            reload: {
                active: false,
                progress: 0,
                startTime: 0,
                currentOffset: new THREE.Vector3(),
                currentRotation: new THREE.Vector3(),
                settings: settings.animations?.reload || {}
            }
        };

        this.currentAmmo = settings.ammo.current;
        this.maxAmmo = settings.ammo.max;
        this.currentPosition = settings.position;
        this.currentRotation = settings.rotation;
        if (this.shootSound && settings.sound?.volume) {
            this.shootSound.setVolume(settings.sound.volume);
        }
        this.settings = settings;
        this.muzzleFlash = null;
        this.ray = new Ray({
            THREE,
            origin: new THREE.Vector3(),
            direction: new THREE.Vector3()
        });
        this.holderType = null;
        this.setupModel();
    }
    setupModel() {
        if (this.model) {
            this.scene.add(this.model);
        }
    }
    setupForHolder(holderName, gunSettings) {
        const scale = gunSettings.model.scaleByHolder[holderName] || gunSettings.model.scale;
        if (this.model) {
            this.model.scale.setScalar(scale);
        }
    }
    updatePosition(deltaTime) {
        if (!this.model || !this.mount) return;
        const mountWorldPosition = this.mount.getWorldPosition();
        const mountWorldRotation = this.mount.getWorldRotation();

        this.model.position.copy(mountWorldPosition);

        if (this.muzzleFlash) {
            this.muzzleFlash.update(this.model.position, this.model.quaternion);
        }

        this.updateModelTransform();
    }

    startAnimation(type) {
        const animation = this.animations[type];
        if (!animation || (type === 'reload' && !APP_SETTINGS.controls.enableGunReload) ||
            (type === 'recoil' && !APP_SETTINGS.controls.enableGunRecoil)) {
            return;
        }

        animation.active = true;
        animation.startTime = Date.now();
        animation.progress = 0;
        animation.currentOffset.set(0, 0, 0);
        if (animation.currentRotation) {
            animation.currentRotation.set(0, 0, 0);
        }
    }

    updateAnimation(type) {
        const animation = this.animations[type];
        if (!animation || !animation.active ||
            (type === 'reload' && !APP_SETTINGS.controls.enableGunReload) ||
            (type === 'recoil' && !APP_SETTINGS.controls.enableGunRecoil)) {
            return;
        }

        const currentTime = Date.now();
        const elapsed = currentTime - animation.startTime;
        const duration = animation.settings.duration;

        if (elapsed >= duration) {
            this.stopAnimation(type);
            return;
        }

        const rawProgress = elapsed / duration;
        let easedProgress;

        if (rawProgress < 0.5) {
            const adjustedProgress = rawProgress * 2;
            const power = type === 'reload' && animation.settings.position?.easing?.power ?
                animation.settings.position.easing.power :
                animation.settings.easing?.power || 2;
            easedProgress = Math.pow(adjustedProgress, power);
        } else {
            const adjustedProgress = (rawProgress - 0.5) * 2;
            const recovery = type === 'reload' && animation.settings.position?.easing?.recovery ?
                animation.settings.position.easing.recovery :
                animation.settings.easing?.recovery || 0.5;
            easedProgress = 1 - Math.pow(adjustedProgress, recovery);
        }

        if (this.mount) {
            this.mount.resetOffsets();

            if (type === 'reload' && animation.settings.position && animation.settings.rotation) {
                const posOffset = new THREE.Vector3(
                    animation.settings.position.offset.x,
                    animation.settings.position.offset.y,
                    animation.settings.position.offset.z
                );
                const rotOffset = new THREE.Vector3(
                    animation.settings.rotation.offset.x,
                    animation.settings.rotation.offset.y,
                    animation.settings.rotation.offset.z
                );
                animation.currentOffset.copy(posOffset).multiplyScalar(easedProgress);
                animation.currentRotation.copy(rotOffset).multiplyScalar(easedProgress);
                this.mount.addPositionOffset(animation.currentOffset);
                this.mount.addRotationOffset(animation.currentRotation);
            } else if (type === 'recoil' && animation.settings.distance) {
                const recoilDistance = animation.settings.distance * easedProgress;
                animation.currentOffset.set(0, recoilDistance * 0.2, recoilDistance);
                this.mount.addPositionOffset(animation.currentOffset);
            }
        }
    }

    stopAnimation(type) {
        const animation = this.animations[type];
        if (!animation) return;

        animation.active = false;
        animation.progress = 0;
        animation.currentOffset.set(0, 0, 0);
        if (animation.currentRotation) {
            animation.currentRotation.set(0, 0, 0);
        }

        if (this.mount) {
            this.mount.resetOffsets();
        }
    }

    updateModelTransform() {
        if (!this.model || !this.mount) return;
        const worldPosition = this.mount.getWorldPosition();
        const worldRotation = this.mount.getWorldRotation();
        this.model.position.copy(worldPosition);

        // Create quaternion for world rotation
        const targetQuaternion = new THREE.Quaternion();
        targetQuaternion.setFromEuler(new THREE.Euler(
            worldRotation.x,
            worldRotation.y,
            worldRotation.z,
            'XYZ'
        ));

        // Apply gun-specific rotation offset if available
        if (this.settings.model.rotationOffset) {
            const offsetQuaternion = new THREE.Quaternion();
            offsetQuaternion.setFromEuler(new THREE.Euler(
                this.settings.model.rotationOffset.x,
                this.settings.model.rotationOffset.y,
                this.settings.model.rotationOffset.z,
                'XYZ'
            ));
            targetQuaternion.multiply(offsetQuaternion);
        }

        this.model.quaternion.copy(targetQuaternion);
    }

    update(deltaTime) {
        if (!this.checkInputSystem()) {
            return;
        }

        if (this.mount) {
            this.updateModelTransform();
        }

        if (this.activeFireRays) {
            this.updateFireRays();
        }
    }

    checkInputSystem() {
        if (!window.Input) {
            console.log('Gun update: Input system not available');
            return false;
        }
        return true;
    }


    playSound(type) {
        if (this.holderType !== 'player') return;
        if (!window.AudioManager) return;

        // Get the sound configuration for this type from gun settings
        const soundConfig = this.settings.sounds?.[type];
        if (!soundConfig) {
            console.warn(`No sound configuration found for type: ${type}`);
            return;
        }
        // Play the sound using the key from the configuration
        if (soundConfig.key) {
            window.AudioManager.play(soundConfig.key);
        }
    }
    resetEffects() {
        this.recoil.active = false;
    }
    getCurrentAmmo() {
        return this.currentAmmo;
    }

    getMaxAmmo() {
        return this.maxAmmo;
    }


    hide() {
        if (this.model) {
            this.model.visible = false;
        }
    }

    show() {
        if (this.model) {
            this.model.visible = true;
        }
    }
}
