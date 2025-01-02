
class Wall {
    constructor(params) {
        // Validate required dependencies
        if (!params) throw new Error('Wall: params object is required');
        if (!params.THREE) throw new Error('Wall: THREE dependency is required');
        if (!params.CANNON) throw new Error('Wall: CANNON dependency is required');
        if (!params.tile) throw new Error('Wall: tile parameter is required');
        if (!params.edge) throw new Error('Wall: edge parameter is required');
        if (!params.tileMap) throw new Error('Wall: tileMap parameter is required');
        if (!params.settings) throw new Error('Wall: settings parameter is required');
        // Store dependencies
        this.THREE = params.THREE;
        this.CANNON = params.CANNON;
        this.tile = params.tile;
        this.edge = params.edge;
        this.tileMap = params.tileMap;
        this.settings = params.settings;
        // Default wall properties from settings
        this.height = this.settings.obstacles.height;
        this.thickness = 2;
        this.material = {
            color: this.settings.obstacles.material.color,
            roughness: this.settings.obstacles.material.roughness,
            metalness: this.settings.obstacles.material.metalness
        };
        // Initialize components
        this.mesh = null;
        this.physicsBody = null;
        this.debugMesh = null;
        // Setup wall
        this.calculateTransform();
        this.createPhysicsBody();
    }

    calculateTransform() {
        const tileSize = this.tileMap.tileSize;
        const tilePos = this.tileMap.gridToWorldPosition(this.tile.x, this.tile.z);

        // Calculate position based on edge
        switch (this.edge) {
            case 'NORTH':
                this.position = new this.THREE.Vector3(
                    tilePos.x,
                    this.height / 2,
                    tilePos.z - tileSize / 2
                );
                this.rotation = 0;
                break;
            case 'SOUTH':
                this.position = new this.THREE.Vector3(
                    tilePos.x,
                    this.height / 2,
                    tilePos.z + tileSize / 2
                );
                this.rotation = 0;
                break;
            case 'EAST':
                this.position = new this.THREE.Vector3(
                    tilePos.x + tileSize / 2,
                    this.height / 2,
                    tilePos.z
                );
                this.rotation = Math.PI / 2;
                break;
            case 'WEST':
                this.position = new this.THREE.Vector3(
                    tilePos.x - tileSize / 2,
                    this.height / 2,
                    tilePos.z
                );
                this.rotation = Math.PI / 2;
                break;
        }

        this.length = tileSize; // Wall length is same as tile size
    }

    createMesh() {
        try {
            const geometry = new this.THREE.BoxGeometry(
                this.length,
                this.height,
                this.thickness
            );
            const material = new this.THREE.MeshStandardMaterial({
                color: this.material.color,
                roughness: this.material.roughness,
                metalness: this.material.metalness
            });
            this.mesh = new this.THREE.Mesh(geometry, material);
            this.mesh.position.copy(this.position);
            this.mesh.rotation.y = this.rotation;
            // Enable shadows
            this.mesh.castShadow = true;
            this.mesh.receiveShadow = true;
            // Make mesh raycastable
            this.mesh.raycast = this.THREE.Mesh.prototype.raycast;
            return this.mesh;
        } catch (error) {
            console.error('Error creating wall mesh:', error);
            throw error;
        }
    }

    createPhysicsBody() {
        try {
            // Create physics body shape
            const halfExtents = new this.CANNON.Vec3(
                this.length / 2,
                this.height / 2,
                this.thickness / 2
            );
            const shape = new this.CANNON.Box(halfExtents);
            // Create static physics body (mass = 0)
            this.physicsBody = new this.CANNON.Body({
                mass: this.settings.obstacles.physics.mass,
                shape: shape,
                position: new this.CANNON.Vec3(this.position.x, this.position.y, this.position.z),
                material: window.GameWorld.physicsWorld.defaultMaterial
            });
            // Set rotation
            this.physicsBody.quaternion.setFromAxisAngle(
                new this.CANNON.Vec3(0, 1, 0),
                this.rotation
            );
            // Set collision groups from settings
            this.physicsBody.collisionFilterGroup = this.settings.physics.collisionGroups.OBSTACLE;
            this.physicsBody.collisionFilterMask =
                this.settings.physics.collisionGroups.PLAYER |
                this.settings.physics.collisionGroups.ENEMY;
            // Add to physics world
            window.GameWorld.physicsWorld.addBody(this.physicsBody);
        } catch (error) {
            console.error('Error creating physics body for wall:', error);
            throw error;
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
        }

        if (this.debugMesh) {
            if (this.debugMesh.geometry) {
                this.debugMesh.geometry.dispose();
            }
            if (this.debugMesh.material) {
                this.debugMesh.material.dispose();
            }
            WorldScene.remove(this.debugMesh);
        }

        if (this.physicsBody) {
            window.GameWorld.physicsWorld.removeBody(this.physicsBody);
        }
    }
}
