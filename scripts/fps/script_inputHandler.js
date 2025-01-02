class InputHandler {
    constructor(params = {}) {
        // Validate required parameters
        this.validateDependencies(params);
        // Store dependencies
        this.THREE = params.THREE;
        this.canvas = params.canvas;
        this.settings = params.settings;

        // Bind methods
        this.mouseHandler = this.handleMouseMove.bind(this);
        this.mouseDownHandler = this.handleMouseDown.bind(this);

        // Initialize state
        this.isMouseDown = false;
        this.lastDebugTime = 0;
        this.debugInterval = 1000; // Log every 1 second
        this.mouseDelta = new this.THREE.Vector2(0, 0);
        this.previousMousePosition = new this.THREE.Vector2(0, 0);
        this.currentMousePosition = new this.THREE.Vector2(0, 0);
        this.mouseMoveAmount = new this.THREE.Vector2(0, 0);
        // Initialize if all dependencies are present
        if (this.checkDependencies()) {
            this.initControls();
        }
    }
    validateDependencies(params) {
        const required = ['THREE', 'canvas', 'settings'];
        const missing = required.filter(dep => !params[dep]);

        if (missing.length > 0) {
            throw new Error(`InputHandler: Missing required dependencies: ${missing.join(', ')}`);
        }
    }
    checkDependencies() {
        try {
            if (!this.canvas || !(this.canvas instanceof HTMLCanvasElement)) {
                throw new Error('Invalid or missing canvas element');
            }
            if (!this.THREE) {
                throw new Error('THREE.js not found');
            }
            if (!this.settings) {
                throw new Error('Settings not provided');
            }
            return true;
        } catch (error) {
            console.error('InputHandler initialization failed:', error);
            return false;
        }
    }
    initControls() {
        try {
            document.addEventListener('mousemove', this.mouseHandler);
            document.addEventListener('click', () => {
                this.canvas.requestPointerLock();
            });
            document.addEventListener('mousedown', this.mouseDownHandler);
            document.addEventListener('mouseup', (event) => this.handleMouseUp(event));
            this.initialized = true;
            console.log('InputHandler initialized successfully');
        } catch (error) {
            console.error('Failed to initialize controls:', error);
            this.initialized = false;
        }
    }
    isInitialized() {
        return this.initialized === true;
    }
    handleMouseDown(event) {
        if (document.pointerLockElement === this.canvas) {
            this.isMouseDown = true;
            this.previousMousePosition.set(event.clientX, event.clientY);
        }
    }
    handleMouseUp(event) {
        if (document.pointerLockElement === this.canvas) {
            this.isMouseDown = false;
        }
    }
    handleMouseMove(event) {
        if (document.pointerLockElement === this.canvas) {
            try {
                const currentTime = Date.now();
                this.currentMousePosition.set(event.clientX, event.clientY);
                this.mouseDelta.set(event.movementX, event.movementY);
                this.mouseMoveAmount.x += Math.abs(this.mouseDelta.x);
                this.mouseMoveAmount.y += Math.abs(this.mouseDelta.y);
                this.previousMousePosition.copy(this.currentMousePosition);
            } catch (error) {
                console.error('Error handling mouse movement:', error);
            }
        }
    }
    getMouseDelta() {
        return {
            ...this.mouseDelta
        };
    }
    getDebugInfo() {
        return {
            delta: {
                ...this.mouseDelta
            },
            current: {
                ...this.currentMousePosition
            },
            previous: {
                ...this.previousMousePosition
            },
            totalMovement: {
                ...this.mouseMoveAmount
            }
        };
    }
    update() {
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
    }
}
