
class FireRay {
    constructor(scene) {
        this.scene = scene;
        this.mesh = null;
        this.startTime = 0;
        this.duration = 250; // Duration in milliseconds
        this.active = false;
    }

    create(start, direction, length = 100) {
        // Create geometry for the ray - half the length since we're positioning from center
        const rayGeometry = new THREE.CylinderGeometry(0.05, 0.05, length, 8);
        rayGeometry.translate(0, length / 2, 0); // Translate geometry so it extends forward from start point

        // Create material for the ray
        const rayMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.8
        });
        // Create mesh
        this.mesh = new THREE.Mesh(rayGeometry, rayMaterial);
        // Position the ray at start point
        this.mesh.position.copy(start);
        // Calculate rotation from direction vector
        const euler = new THREE.Euler();
        euler.setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0), // Cylinder's default up vector
            direction.normalize()
        ));
        this.mesh.rotation.copy(euler);

        // Add to scene
        this.scene.add(this.mesh);

        // Set state
        this.startTime = Date.now();
        this.active = true;
    }

    update() {
        if (!this.active || !this.mesh) return;

        const elapsed = Date.now() - this.startTime;
        if (elapsed >= this.duration) {
            this.dispose();
            return;
        }

        // Fade out effect
        const opacity = 1 - (elapsed / this.duration);
        this.mesh.material.opacity = opacity;
    }

    dispose() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) this.mesh.material.dispose();
            this.mesh = null;
        }
        this.active = false;
        // Clean up debug visuals
        if (APP_SETTINGS.debug.gunVisuals) {
            if (this.debugSphere) {
                this.scene.remove(this.debugSphere);
                this.debugSphere.geometry.dispose();
                this.debugSphere.material.dispose();
            }
            if (this.debugArrow) {
                this.scene.remove(this.debugArrow);
            }
            if (this.debugMountSphere) {
                this.scene.remove(this.debugMountSphere);
                this.debugMountSphere.geometry.dispose();
                this.debugMountSphere.material.dispose();
            }
            if (this.debugMountArrow) {
                this.scene.remove(this.debugMountArrow);
            }
        }
    }
}