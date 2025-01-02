

class Tile {
    constructor(params) {
        if (!params.physicsWorld) {
            throw new Error('Tile: physicsWorld is required');
        }
        this.THREE = params.THREE;
        this.Materials = params.Materials;
        this.x = params.x;
        this.z = params.z;
        this.size = params.size;
        this.physicsWorld = params.physicsWorld;
        this.collisionGroups = params.collisionGroups;
        this.materialSettings = params.materialSettings || {
            color: 0xFFFFFF,
            roughness: 0.7,
            metalness: 0.3
        };
        this.mesh = null;
        this.body = null;
        this.createMesh();
        this.createPhysicsBody();
    }
    createMesh() {
        const geometry = new this.THREE.BoxGeometry(this.size, 0.1, this.size);
        const material = this.createTileMaterial();
        this.mesh = new this.THREE.Mesh(geometry, material);
        this.mesh.position.set(this.x, 0, this.z);
        this.mesh.raycast = this.THREE.Mesh.prototype.raycast;
        this.mesh.receiveShadow = true;
    }
    createPhysicsBody() {
        // Create physics shape matching the mesh dimensions
        const halfExtents = new CANNON.Vec3(
            this.size * 0.5, // X: half width
            0.05, // Y: half height (0.1 / 2)
            this.size * 0.5 // Z: half depth
        );
        const shape = new CANNON.Box(halfExtents);
        // Create static body (mass = 0)
        this.body = new CANNON.Body({
            mass: 0, // Static body
            position: new CANNON.Vec3(this.x, 0, this.z),
            shape: shape,
            material: new CANNON.Material({
                friction: 0.3,
                restitution: 0.3
            })
        });
        // Set collision groups
        this.body.collisionFilterGroup = this.collisionGroups.GROUND;
        this.body.collisionFilterMask =
            this.collisionGroups.PLAYER |
            this.collisionGroups.ENEMY |
            this.collisionGroups.OBSTACLE;
        // Add body to physics world
        this.physicsWorld.addBody(this.body);
    }
    createTileMaterial() {
        return this.Materials.create('tileMaterial', 'standard', this.materialSettings);
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
        if (this.body && this.physicsWorld) {
            this.physicsWorld.removeBody(this.body);
        }
    }
}
