
class Ray {
    constructor(params) {
        if (!params) {
            throw new Error('Ray: params object is required');
        }
        // Validate required dependencies
        if (!params.THREE) {
            throw new Error('Ray: THREE dependency is required');
        }
        // Store dependencies
        this.THREE = params.THREE;
        this.far = params.far || 100;
        // Initialize properties with far parameter
        this.ray = new this.THREE.Raycaster(undefined, undefined, 0, this.far);

        // Set initial origin and direction if provided
        if (params.origin && params.direction) {
            this.update(params.origin, params.direction);
        }
    }

    update(origin, direction) {
        if (!origin || !direction) {
            throw new Error('Ray: Invalid origin or direction');
        }

        try {
            this.ray.set(origin, direction);
        } catch (error) {
            console.error('Ray: Error updating raycaster:', error);
            throw error;
        }
    }
    getFar() {
        return this.far;
    }
    checkIntersection(object) {
        if (!object || !this.ray) {
            throw new Error('Ray: Cannot check intersection - invalid object or ray');
        }

        try {
            const intersects = this.ray.intersectObject(object, true);
            return intersects.length > 0 ? intersects[0] : null;
        } catch (error) {
            console.error('Ray: Error checking intersection:', error);
            throw error;
        }
    }

    dispose() {
        this.ray = null;
        this.THREE = null;
    }
}
