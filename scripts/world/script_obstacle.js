

class Obstacle {
    constructor(params) {
        if (!params) {
            throw new Error('Obstacle: params object is required');
        }
        // Validate required dependencies
        if (!params.THREE) {
            throw new Error('Obstacle: THREE dependency is required');
        }
        if (!params.position || !params.position instanceof params.THREE.Vector3) {
            throw new Error('Obstacle: Valid position Vector3 is required');
        }
        if (!params.settings || !params.settings.obstacles || !params.settings.tilemap) {
            throw new Error('Obstacle: Valid settings object is required');
        }
        // Store dependencies
        this.THREE = params.THREE;
        this.position = params.position;
        this.settings = params.settings;
        // Initialize properties
        this.tileSize = this.settings.tilemap.tileSize;
        this.height = this.settings.obstacles.height;
        this.mesh = null;
        this.physicsBody = null;
        // Create the mesh and physics body
        try {
            this.mesh = this.createMesh();
            this.createPhysicsBody();
        } catch (error) {
            console.error('Obstacle: Error creating obstacle:', error);
            throw error;
        }
    }
    createMesh() {
        const geometry = new this.THREE.BoxGeometry(
            this.tileSize,
            this.height,
            this.tileSize
        );
        const material = new this.THREE.MeshStandardMaterial({
            color: this.settings.obstacles.material.color,
            roughness: this.settings.obstacles.material.roughness,
            metalness: this.settings.obstacles.material.metalness
        });
        const mesh = new this.THREE.Mesh(geometry, material);
        mesh.position.copy(this.position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // Make mesh raycastable
        mesh.raycast = this.THREE.Mesh.prototype.raycast;
        return mesh;
    }
    createPhysicsBody() {
        // Create physics shape matching the mesh dimensions
        const halfExtents = new CANNON.Vec3(
            this.tileSize * 0.5,
            this.height * 0.5,
            this.tileSize * 0.5
        );
        const shape = new CANNON.Box(halfExtents);
        // Create static body (mass = 0)
        this.physicsBody = new CANNON.Body({
            mass: this.settings.obstacles.physics.mass,
            type: CANNON.Body.STATIC,
            position: new CANNON.Vec3(this.position.x, this.position.y, this.position.z),
            material: new CANNON.Material(this.settings.obstacles.physics)
        });
        // Set collision filter to interact with everything
        this.physicsBody.collisionFilterGroup = this.settings.physics.collisionGroups.OBSTACLE;
        this.physicsBody.collisionFilterMask =
            this.settings.physics.collisionGroups.PLAYER |
            this.settings.physics.collisionGroups.OBSTACLE |
            this.settings.physics.collisionGroups.GROUND |
            this.settings.physics.collisionGroups.ENEMY;
        // Add shape to body
        this.physicsBody.addShape(shape);
        // Add body to physics world
        window.GameWorld.physicsWorld.addBody(this.physicsBody);
    }
    dispose() {
        if (this.mesh) {
            if (this.mesh.geometry) {
                this.mesh.geometry.dispose();
            }
            if (this.mesh.material) {
                this.mesh.material.dispose();
            }
        }

        // Remove physics body from world
        if (this.physicsBody && window.GameWorld.physicsWorld) {
            window.GameWorld.physicsWorld.removeBody(this.physicsBody);
        }
    }
}
