class MuzzleFlash {
    constructor(scene, settings = {}) {
        this.scene = scene;
        this.settings = {
            offset: settings.offset || APP_SETTINGS.muzzleFlash.defaultOffset,
            size: settings.size || APP_SETTINGS.muzzleFlash.defaultSize,
            color: settings.color || APP_SETTINGS.muzzleFlash.defaultColor,
            duration: settings.duration || APP_SETTINGS.muzzleFlash.defaultDuration,
            intensity: APP_SETTINGS.muzzleFlash.intensity,
            decayRate: APP_SETTINGS.muzzleFlash.decayRate
        };
        this.visible = false;
        this.currentIntensity = this.settings.intensity;
        this.createMesh();
    }
    createMesh() {
        const geometry = new THREE.PlaneGeometry(this.settings.size, this.settings.size);
        const material = new THREE.MeshBasicMaterial({
            color: this.settings.color,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.visible = false;
        this.scene.add(this.mesh);
    }
    show() {
        if (!this.mesh) return;

        this.mesh.visible = true;
        this.mesh.material.opacity = this.settings.intensity;
        this.currentIntensity = this.settings.intensity;
        this.visible = true;
        setTimeout(() => this.hide(), this.settings.duration);
    }
    hide() {
        if (!this.mesh) return;
        this.mesh.visible = false;
        this.mesh.material.opacity = 0;
        this.visible = false;
    }
    update(gunPosition, gunQuaternion) {
        if (!this.mesh) return;
        // Update position based on gun's position and rotation
        const offsetVector = new THREE.Vector3(
            this.settings.offset.x,
            this.settings.offset.y,
            this.settings.offset.z
        );
        offsetVector.applyQuaternion(gunQuaternion);

        this.mesh.position.copy(gunPosition).add(offsetVector);
        this.mesh.quaternion.copy(gunQuaternion);
        // Update intensity if visible
        if (this.visible) {
            this.currentIntensity *= this.settings.decayRate;
            this.mesh.material.opacity = this.currentIntensity;

            if (this.currentIntensity < 0.01) {
                this.hide();
            }
        }
    }
    dispose() {
        if (this.mesh) {
            if (this.mesh.geometry) {
                this.mesh.geometry.dispose();
            }
            if (this.mesh.material) {
                this.mesh.material.dispose();
            }
            this.scene.remove(this.mesh);
        }
    }
}