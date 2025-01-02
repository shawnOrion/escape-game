class CameraController {
    constructor(params = {}) {
        // Validate required dependencies
        if (!params.THREE) {
            throw new Error('CameraController: THREE is required');
        }
        if (!params.camera) {
            throw new Error('CameraController: camera is required');
        }
        if (!params.settings) {
            throw new Error('CameraController: settings is required');
        }
        // Store dependencies
        this.THREE = params.THREE;
        this.camera = params.camera;
        this.settings = params.settings;
        // Initialize properties
        this.input = window.Input || null;
        this.lastDebugTime = 0;
        this.debugInterval = 1000;
        // Create collision box
        this.collisionBox = new CameraCollisionBox(this.camera);
        // Rotation parameters
        this.phi = 0; // Vertical rotation
        this.theta = 0; // Horizontal rotation
        this.sensitivity = {
            x: this.settings.controls.mouseSensitivity.x,
            y: this.settings.controls.mouseSensitivity.y
        };
        // Rotation limits
        this.minPhi = -Math.PI / 2;
        this.maxPhi = Math.PI / 2;
        this.initializeInput();
    }
    initializeInput() {
        if (!this.input) {
            this.input = window.Input;
            if (!this.input) {
                console.warn('CameraController: Input system not available, retrying...');
                setTimeout(() => this.initializeInput(), 100);
                return;
            }
        }
        console.log('CameraController: Input system initialized');
    }
    updateRotation() {
        if (!this.input) {
            this.initializeInput();
            return;
        }
        try {
            const mouseDelta = this.input.getMouseDelta();
            if (!mouseDelta) {
                console.warn('CameraController: Invalid mouse delta');
                return;
            }
            // Update rotation angles based on mouse movement
            this.theta -= mouseDelta.x * this.sensitivity.x;
            this.phi -= mouseDelta.y * this.sensitivity.y;
            // Clamp vertical rotation
            this.phi = Math.max(this.minPhi, Math.min(this.maxPhi, this.phi));
            // Calculate rotation matrices
            const rotationX = new this.THREE.Matrix4().makeRotationX(this.phi);
            const rotationY = new this.THREE.Matrix4().makeRotationY(this.theta);
            // Combine rotations (Y first, then X)
            const finalRotation = new this.THREE.Matrix4().multiplyMatrices(rotationY, rotationX);
            // Apply rotation to camera
            this.camera.quaternion.setFromRotationMatrix(finalRotation);
        } catch (error) {
            console.error('CameraController: Error updating rotation:', error);
        }
    }
    getForwardVector() {
        const forward = new this.THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.camera.quaternion);
        return forward;
    }
    getRightVector() {
        const right = new this.THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this.camera.quaternion);
        return right;
    }
    update() {
        this.updateRotation();
        if (this.collisionBox) {
            this.collisionBox.update();
        }
    }
}