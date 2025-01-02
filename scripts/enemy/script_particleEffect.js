
class ParticleDeathEffect {
    constructor(params) {
        if (!params) {
            throw new Error('ParticleDeathEffect: params object is required');
        }

        // Validate required dependencies
        if (!params.THREE) {
            throw new Error('ParticleDeathEffect: THREE is required');
        }
        if (!params.scene) {
            throw new Error('ParticleDeathEffect: scene is required');
        }
        if (!params.model) {
            throw new Error('ParticleDeathEffect: model is required');
        }

        // Store dependencies
        this.THREE = params.THREE;
        this.scene = params.scene;
        this.model = params.model;

        // Initialize properties
        this.particles = [];
        this.particleSystem = null;
        this.startTime = null;
        this.duration = params.duration || 1000;
        this.active = false;

        // Initialize the system
        this.initParticleSystem();
    }

    initParticleSystem() {
        const particleCount = 1000;
        const geometry = new this.THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        this.particleIndices = new Int32Array(particleCount);
        this.particleMeshes = new Array(particleCount);
        let validMeshes = [];
        this.model.traverse(child => {
            if (child.isMesh && child.geometry) {
                validMeshes.push(child);
            }
        });
        for (let i = 0; i < particleCount; i++) {
            const meshIndex = Math.floor(Math.random() * validMeshes.length);
            const selectedMesh = validMeshes[meshIndex];
            const positionAttribute = selectedMesh.geometry.attributes.position;
            const vertexIndex = Math.floor(Math.random() * positionAttribute.count);
            this.particleMeshes[i] = selectedMesh;
            this.particleIndices[i] = vertexIndex;
            const vertex = new this.THREE.Vector3();
            vertex.fromBufferAttribute(positionAttribute, vertexIndex);
            vertex.applyMatrix4(selectedMesh.matrixWorld);
            positions[i * 3] = vertex.x;
            positions[i * 3 + 1] = vertex.y;
            positions[i * 3 + 2] = vertex.z;
            velocities[i * 3] = (Math.random() - 0.5) * 2;
            velocities[i * 3 + 1] = Math.random() * 4;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;
            colors[i * 3] = 1;
            colors[i * 3 + 1] = 0.8;
            colors[i * 3 + 2] = 0.2;
        }

        geometry.setAttribute('position', new this.THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new this.THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('color', new this.THREE.BufferAttribute(colors, 3));
        // Create particle material
        const material = new this.THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 1,
            blending: this.THREE.AdditiveBlending
        });

        // Create particle system
        this.particleSystem = new this.THREE.Points(geometry, material);
        this.scene.add(this.particleSystem);
    }

    getRandomPointOnModel() {
        if (!this.model) return new this.THREE.Vector3();

        const vertex = new this.THREE.Vector3();
        let geometry;

        // Find first mesh with geometry
        this.model.traverse(child => {
            if (child.isMesh && !geometry) {
                geometry = child.geometry;
            }
        });

        if (geometry) {
            const positions = geometry.attributes.position;
            const index = Math.floor(Math.random() * positions.count);
            vertex.fromBufferAttribute(positions, index);
            vertex.applyMatrix4(this.model.matrixWorld);
        }

        return vertex;
    }

    start() {
        this.startTime = Date.now();
        this.active = true;
    }

    update() {
        if (!this.active || !this.particleSystem) return;
        const elapsed = Date.now() - this.startTime;
        if (elapsed >= this.duration) {
            this.dispose();
            return;
        }
        const progress = elapsed / this.duration;
        const positions = this.particleSystem.geometry.attributes.position;
        const velocities = this.particleSystem.geometry.attributes.velocity;
        const tempVertex = new this.THREE.Vector3();
        for (let i = 0; i < positions.count; i++) {
            // Get current animated position from mesh
            const mesh = this.particleMeshes[i];
            const vertexIndex = this.particleIndices[i];

            if (mesh && mesh.geometry) {
                tempVertex.fromBufferAttribute(mesh.geometry.attributes.position, vertexIndex);
                tempVertex.applyMatrix4(mesh.matrixWorld);

                // Blend between animated position and particle physics
                const physicsWeight = Math.min(1, progress * 2); // Increase physics influence over time

                const px = positions.array[i * 3];
                const py = positions.array[i * 3 + 1];
                const pz = positions.array[i * 3 + 2];
                const vx = velocities.array[i * 3];
                const vy = velocities.array[i * 3 + 1];
                const vz = velocities.array[i * 3 + 2];
                // Blend between animated position and physics simulation
                positions.array[i * 3] = tempVertex.x * (1 - physicsWeight) + (px + vx * 0.01) * physicsWeight;
                positions.array[i * 3 + 1] = tempVertex.y * (1 - physicsWeight) + (py + vy * 0.01) * physicsWeight;
                positions.array[i * 3 + 2] = tempVertex.z * (1 - physicsWeight) + (pz + vz * 0.01) * physicsWeight;
            }
        }
        positions.needsUpdate = true;
        this.particleSystem.material.opacity = 1 - progress;
    }

    dispose() {
        if (this.particleSystem) {
            this.scene.remove(this.particleSystem);
            this.particleSystem.geometry.dispose();
            this.particleSystem.material.dispose();
            this.particleSystem = null;
        }
        this.active = false;
    }
}
