
class NavMesh {
    constructor(params) {
        this.validateParams(params);

        // Store dependencies
        this.THREE = params.THREE;
        this.tileMap = params.tileMap;
        this.settings = params.settings;
        this.scene = params.scene || window.WorldScene;

        // Store configuration
        this.config = {
            pointSize: params.pointSize || 1.5,
            pointColor: params.pointColor || 0xff0000,
            lineColor: params.lineColor || 0xffff00,
            lineWidth: params.lineWidth || 3,
            maxConnectionDistance: params.maxConnectionDistance || 1.5
        };
        // Initialize properties
        this.points = [];
        this.visualElements = new this.THREE.Group();
        this.visualElements.visible = this.settings.controls.showNavMesh;
        try {
            this.generateGrid();
            this.createVisualization();
            this.scene.add(this.visualElements);
        } catch (error) {
            console.error('NavMesh initialization failed:', error);
            throw error;
        }
    }
    validateParams(params) {
        if (!params) {
            throw new Error('NavMesh: params object is required');
        }
        const requiredDeps = {
            THREE: 'THREE.js library',
            tileMap: 'TileMap instance',
            settings: 'Settings configuration'
        };
        for (const [key, name] of Object.entries(requiredDeps)) {
            if (!params[key]) {
                throw new Error(`NavMesh: ${name} is required but missing from params`);
            }
        }
        if (!(params.tileMap.isTileOccupied && typeof params.tileMap.isTileOccupied === 'function')) {
            throw new Error('NavMesh: TileMap instance must implement isTileOccupied method');
        }
    }
    isCornerOfOccupiedTile(gridX, gridZ) {
        // Check all four tiles that share this corner
        const tilesToCheck = [{
            x: gridX - 1,
            z: gridZ - 1
        }, {
            x: gridX - 1,
            z: gridZ
        }, {
            x: gridX,
            z: gridZ - 1
        }, {
            x: gridX,
            z: gridZ
        }];
        // If any of these tiles are occupied, this is a corner of an occupied tile
        return tilesToCheck.some(tile =>
            tile.x >= 0 && tile.x < this.tileMap.width &&
            tile.z >= 0 && tile.z < this.tileMap.height &&
            this.tileMap.isTileOccupied(tile.x, tile.z)
        );
    }
    generateGrid() {
        const tileSize = this.tileMap.tileSize;
        const width = this.tileMap.width;
        const height = this.tileMap.height;
        // Generate points at tile corners (intersections)
        for (let x = 0; x <= width; x++) {
            for (let z = 0; z <= height; z++) {
                if (!this.isCornerOfOccupiedTile(x, z)) {
                    const xPos = (x - width / 2) * tileSize;
                    const zPos = (z - height / 2) * tileSize;
                    this.addPoint(xPos, zPos, 5);
                }
            }
        }
        // Generate points at tile centers and quarter points
        for (let x = 0; x < width; x++) {
            for (let z = 0; z < height; z++) {
                if (!this.tileMap.isTileOccupied(x, z)) {
                    // Center point
                    const worldPos = this.tileMap.gridToWorldPosition(x, z);
                    this.addPoint(worldPos.x, worldPos.z, 5);

                    // Quarter points
                    const quarterSize = tileSize / 4;
                    const baseX = (x - width / 2) * tileSize;
                    const baseZ = (z - height / 2) * tileSize;

                    // Add quarter points in a grid pattern within the tile
                    for (let qx = 1; qx < 4; qx += 2) {
                        for (let qz = 1; qz < 4; qz += 2) {
                            const quarterX = baseX + (qx * quarterSize);
                            const quarterZ = baseZ + (qz * quarterSize);
                            this.addPoint(quarterX, quarterZ, 5);
                        }
                    }
                }
            }
        }
    }
    hasAdjacentOccupiedTile(x, z) {
        const adjacentTiles = [{
                x: x - 1,
                z: z
            }, // Left
            {
                x: x + 1,
                z: z
            }, // Right
            {
                x: x,
                z: z - 1
            }, // Front
            {
                x: x,
                z: z + 1
            }, // Back
            {
                x: x - 1,
                z: z - 1
            }, // Diagonal Front-Left
            {
                x: x + 1,
                z: z - 1
            }, // Diagonal Front-Right
            {
                x: x - 1,
                z: z + 1
            }, // Diagonal Back-Left
            {
                x: x + 1,
                z: z + 1
            } // Diagonal Back-Right
        ];
        return adjacentTiles.some(tile =>
            tile.x >= 0 && tile.x < this.tileMap.width &&
            tile.z >= 0 && tile.z < this.tileMap.height &&
            this.tileMap.isTileOccupied(tile.x, tile.z)
        );
    }
    addPoint(x, z, y) {
        const point = new this.THREE.Vector3(x, y, z);
        this.points.push(point);
    }
    createVisualization() {
        // Remove existing visualization
        this.removeVisualization();
        // Create points visualization
        const pointGeometry = new this.THREE.SphereGeometry(this.pointSize, 8, 8);
        const pointMaterial = new this.THREE.MeshBasicMaterial({
            color: this.pointColor
        });
        this.points.forEach(point => {
            const pointMesh = new this.THREE.Mesh(pointGeometry, pointMaterial);
            pointMesh.position.copy(point);
            this.visualElements.add(pointMesh);
        });
        // Initialize points array
        this.points = this.points || [];
        // Create lines between adjacent points
        const lineMaterial = new this.THREE.LineBasicMaterial({
            color: this.lineColor,
            linewidth: 3 // Note: linewidth only works in WebGLRenderer with certain conditions
        });
        const tileSize = this.tileMap.tileSize;
        for (let i = 0; i < this.points.length; i++) {
            for (let j = i + 1; j < this.points.length; j++) {
                const distance = this.points[i].distanceTo(this.points[j]);
                if (distance <= tileSize * 1.5) { // Connect points within reasonable distance
                    const lineGeometry = new this.THREE.BufferGeometry().setFromPoints([
                        this.points[i],
                        this.points[j]
                    ]);
                    const line = new this.THREE.Line(lineGeometry, lineMaterial);
                    this.visualElements.add(line);
                }
            }
        }
    }
    removeVisualization() {
        while (this.visualElements.children.length > 0) {
            const child = this.visualElements.children[0];
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
            this.visualElements.remove(child);
        }
    }
    dispose() {
        this.removeVisualization();
        window.WorldScene.remove(this.visualElements);
        this.points = [];
    }
}