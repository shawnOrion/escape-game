
class GunMount {
    constructor(params = {}) {
        if (!params.THREE) {
            throw new Error('GunMount: THREE dependency is required');
        }
        if (!params.mountPoint) {
            throw new Error('GunMount: mountPoint is required');
        }
        if (!params.defaultPosition || !params.defaultRotation) {
            throw new Error('GunMount: defaultPosition and defaultRotation are required');
        }
        this.THREE = params.THREE;
        this.mountPoint = params.mountPoint;

        // Initialize vectors using passed THREE instance
        this.defaultPosition = new this.THREE.Vector3().copy(params.defaultPosition);
        this.defaultRotation = new this.THREE.Vector3().copy(params.defaultRotation);
        this.currentPosition = new this.THREE.Vector3().copy(params.defaultPosition);
        this.currentRotation = new this.THREE.Vector3().copy(params.defaultRotation);
        this.gunSettings = null;
        this.offsetPosition = new this.THREE.Vector3();
        this.offsetRotation = new this.THREE.Vector3();
        // World position and rotation tracking
        this.currentWorldPosition = new this.THREE.Vector3();
        this.currentWorldRotation = new this.THREE.Vector3();
        this.currentWorldQuaternion = new this.THREE.Quaternion();
        this.previousWorldPosition = new this.THREE.Vector3();
        this.previousWorldRotation = new this.THREE.Vector3();
        this.previousWorldQuaternion = new this.THREE.Quaternion();
    }

    update(deltaTime) {
        try {
            const worldPosition = this.getWorldPosition();
            const worldRotation = this.getWorldRotation();
            const mountQuaternion = new this.THREE.Quaternion();
            this.mountPoint.getWorldQuaternion(mountQuaternion);
            this.currentWorldPosition = worldPosition;
            this.currentWorldRotation = worldRotation;
            this.currentWorldQuaternion = mountQuaternion;
        } catch (error) {
            console.error('GunMount: Error updating mount:', error);
        }
    }

    setPosition(position) {
        this.currentPosition.copy(position);
    }
    setRotation(rotation) {
        this.currentRotation.copy(rotation);
    }
    addPositionOffset(offset) {
        this.offsetPosition.add(offset);
    }
    addRotationOffset(offset) {
        this.offsetRotation.add(offset);
    }
    resetOffsets() {
        this.offsetPosition.set(0, 0, 0);
        this.offsetRotation.set(0, 0, 0);
    }
    getWorldPosition() {
        try {
            const mountWorldPosition = new this.THREE.Vector3();
            const mountWorldQuaternion = new this.THREE.Quaternion();
            const finalPosition = new this.THREE.Vector3();

            this.mountPoint.getWorldPosition(mountWorldPosition);
            this.mountPoint.getWorldQuaternion(mountWorldQuaternion);
            finalPosition.copy(this.currentPosition);

            if (this.gunSettings?.model?.positionOffset) {
                const posOffset = this.gunSettings.model.positionOffset;
                finalPosition.add(new this.THREE.Vector3(posOffset.x, posOffset.y, posOffset.z));
            }

            if (this.offsetPosition.lengthSq() > 0) {
                finalPosition.add(this.offsetPosition);
            }

            finalPosition.applyQuaternion(mountWorldQuaternion);
            finalPosition.add(mountWorldPosition);
            return finalPosition;
        } catch (error) {
            console.error('GunMount: Error calculating world position:', error);
            return new this.THREE.Vector3();
        }
    }
    getWorldRotation() {
        const currentQuaternion = new this.THREE.Quaternion();
        const offsetQuaternion = new this.THREE.Quaternion();
        currentQuaternion.setFromEuler(new this.THREE.Euler(
            this.currentRotation.x,
            this.currentRotation.y,
            this.currentRotation.z
        ));

        offsetQuaternion.setFromEuler(new this.THREE.Euler(
            this.offsetRotation.x,
            this.offsetRotation.y,
            this.offsetRotation.z
        ));

        const mountQuaternion = new this.THREE.Quaternion();
        this.mountPoint.getWorldQuaternion(mountQuaternion);

        const finalQuaternion = new this.THREE.Quaternion();
        finalQuaternion
            .multiplyQuaternions(mountQuaternion, currentQuaternion)
            .multiply(offsetQuaternion);

        const finalRotation = new this.THREE.Euler().setFromQuaternion(finalQuaternion);
        return new this.THREE.Vector3(finalRotation.x, finalRotation.y, finalRotation.z);
    }

    reset() {
        this.currentPosition.copy(this.defaultPosition);
        this.currentRotation.copy(this.defaultRotation);
        this.resetOffsets();
    }
}