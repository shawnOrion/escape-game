
class TileMap {
    constructor(params) {
        // Initialize storage arrays
        this.obstaclesList = [];
        this.wallsList = [];
        // Validate core dependencies
        if (!params) {
            throw new Error('TileMap: params object is required');
        }
        const requiredDependencies = {
            THREE: 'THREE.js library',
            CANNON: 'CANNON.js physics engine',
            settings: 'Application settings',
            Materials: 'Materials manager',
            Tile: 'Tile class',
            Wall: 'Wall class',
            Obstacle: 'Obstacle class',
            NavMesh: 'NavMesh class',
            physicsWorld: 'Physics world'
        };
        // Validate all required dependencies
        Object.entries(requiredDependencies).forEach(([key, name]) => {
            if (!params[key]) {
                throw new Error(`TileMap: ${name} (${key}) is required`);
            }
        });
        // Store core dependencies
        this.THREE = params.THREE;
        this.CANNON = params.CANNON;
        this.settings = params.settings;
        this.Materials = window.Materials || params.Materials;
        this.physicsWorld = window.GameWorld?.physicsWorld || params.physicsWorld;
        // Store class dependencies
        this.Tile = params.Tile;
        this.Wall = params.Wall;
        this.Obstacle = params.Obstacle;
        this.NavMesh = params.NavMesh;
        if (!this.physicsWorld) {
            throw new Error('TileMap: Physics world not available');
        }
        // Initialize properties
        this.width = this.settings.tilemap.width;
        this.height = this.settings.tilemap.height;
        this.tileSize = this.settings.tilemap.tileSize;
        this.tiles = [];
        this.mapMesh = new this.THREE.Group();
        this.occupiedPositions = new Set();
        this.navMesh = null;
    }
    createTiles() {
        if (!this.Materials || !this.THREE) {
            throw new Error('TileMap: Required dependencies not available for tile creation');
        }
        // Create individual visual tiles
        for (let x = 0; x < this.width; x++) {
            for (let z = 0; z < this.height; z++) {
                const tileX = (x - this.width / 2 + 0.5) * this.tileSize;
                const tileZ = (z - this.height / 2 + 0.5) * this.tileSize;
                const tile = new this.Tile({
                    THREE: this.THREE,
                    Materials: this.Materials,
                    x: tileX,
                    z: tileZ,
                    size: this.tileSize,
                    materialSettings: this.settings.tilemap.tileMaterial || {
                        color: 0xFFFFFF,
                        roughness: 0.7,
                        metalness: 0.3
                    },
                    physicsWorld: this.physicsWorld,
                    collisionGroups: this.settings.physics.collisionGroups
                });
                this.tiles.push(tile);
                this.mapMesh.add(tile.mesh);
            }
        }
    }
    placeWallsAlongEdge(edge) {
        const placements = [];

        switch (edge) {
            case 'NORTH':
                ``
                for (let x = 0; x < this.width; x++) {
                    placements.push({
                        tile: {
                            x: x,
                            z: 0
                        },
                        edge: 'NORTH'
                    });
                }
                break;
            case 'SOUTH':
                for (let x = 0; x < this.width; x++) {
                    placements.push({
                        tile: {
                            x: x,
                            z: this.height - 1
                        },
                        edge: 'SOUTH'
                    });
                }
                break;
            case 'EAST':
                for (let z = 0; z < this.height; z++) {
                    placements.push({
                        tile: {
                            x: this.width - 1,
                            z: z
                        },
                        edge: 'EAST'
                    });
                }
                break;
            case 'WEST':
                for (let z = 0; z < this.height; z++) {
                    placements.push({
                        tile: {
                            x: 0,
                            z: z
                        },
                        edge: 'WEST'
                    });
                }
                break;
        }

        this.wallsList = []; // Clear existing walls
        placements.forEach(placement => {
            const wall = new this.Wall({
                THREE: this.THREE,
                CANNON: this.CANNON,
                tile: placement.tile,
                edge: placement.edge,
                tileMap: this,
                settings: this.settings
            });
            const wallMesh = wall.createMesh();
            if (wallMesh) {
                this.mapMesh.add(wallMesh);
                this.wallsList.push(wall);
                console.log(`Wall placed at tile (${placement.tile.x}, ${placement.tile.z}) on ${placement.edge} edge`);
            }
        });
    }

    placeWalls() {
        // Place walls along all edges without checking settings
        this.placeWallsAlongEdge('NORTH');
        this.placeWallsAlongEdge('SOUTH');
        this.placeWallsAlongEdge('EAST');
        this.placeWallsAlongEdge('WEST');
    }
    getTileAt(x, z) {
        return this.tiles[x * this.height + z];
    }

    render() {
        return this.mapMesh;
    }
    createGridLines() {
        if (!this.THREE) {
            throw new Error('TileMap: THREE dependency required for grid line creation');
        }

        const material = new this.THREE.LineBasicMaterial({
            color: this.settings.tilemap.gridColor || 0x000000
        });
        const points = [];
        // Create vertical lines
        for (let x = 0; x <= this.width; x++) {
            const xPos = (x - this.width / 2) * this.tileSize;
            points.push(new this.THREE.Vector3(xPos, 0.1, -this.height * this.tileSize / 2));
            points.push(new this.THREE.Vector3(xPos, 0.1, this.height * this.tileSize / 2));
        }
        // Create horizontal lines
        for (let z = 0; z <= this.height; z++) {
            const zPos = (z - this.height / 2) * this.tileSize;
            points.push(new this.THREE.Vector3(-this.width * this.tileSize / 2, 0.1, zPos));
            points.push(new this.THREE.Vector3(this.width * this.tileSize / 2, 0.1, zPos));
        }
        const geometry = new this.THREE.BufferGeometry().setFromPoints(points);
        return new this.THREE.LineSegments(geometry, material);
    }


    worldToGridPosition(worldX, worldZ) {
        const gridX = Math.floor((worldX + (this.width * this.tileSize) / 2) / this.tileSize);
        const gridZ = Math.floor((worldZ + (this.height * this.tileSize) / 2) / this.tileSize);
        return {
            x: gridX,
            z: gridZ
        };
    }

    gridToWorldPosition(gridX, gridZ) {
        const worldX = (gridX - this.width / 2 + 0.5) * this.tileSize;
        const worldZ = (gridZ - this.height / 2 + 0.5) * this.tileSize;
        return {
            x: worldX,
            z: worldZ
        };
    }

    isTileOccupied(gridX, gridZ) {
        return this.occupiedPositions.has(`${gridX},${gridZ}`);
    }

    markTileOccupied(gridX, gridZ) {
        const key = `${gridX},${gridZ}`;
        if (!this.occupiedPositions.has(key)) {
            this.occupiedPositions.add(key);
        }
    }

    toggleNavMeshVisualization() {
        if (this.navMesh) {
            if (this.navMesh.visualElements.visible) {
                this.navMesh.visualElements.visible = false;
            } else {
                this.navMesh.visualElements.visible = true;
            }
        }
    }
    initNavMesh() {
        if (this.navMesh) {
            this.navMesh.dispose();
        }
        this.navMesh = new NavMesh({
            THREE: this.THREE,
            tileMap: this,
            settings: this.settings,
            width: this.width,
            height: this.height,
            tileSize: this.tileSize
        });
    }

    placeObstacles() {
        if (!this.settings.tilemap.obstacles || !Array.isArray(this.settings.tilemap.obstacles)) {
            return;
        }
        this.obstaclesList = []; // Clear existing obstacles
        this.settings.tilemap.obstacles.forEach(pos => {
            const worldPos = this.gridToWorldPosition(pos.x, pos.z);
            try {
                const obstacle = new this.Obstacle({
                    THREE: this.THREE,
                    position: new this.THREE.Vector3(worldPos.x, this.height / 2 + 0.05, worldPos.z),
                    settings: this.settings,
                    scene: this.scene,
                    physicsWorld: this.physicsWorld
                });
                if (obstacle.mesh) {
                    this.mapMesh.add(obstacle.mesh);
                    this.markTileOccupied(pos.x, pos.z);
                    this.obstaclesList.push(obstacle);
                }
            } catch (error) {
                console.error(`Error creating obstacle at position (${pos.x}, ${pos.z}):`, error);
            }
        });
    }
    // Getter methods for obstacles and walls
    getObstacles() {
        return this.obstaclesList;
    }
    getWalls() {
        return this.wallsList;
    }

    getTiles(){
        return this.tiles;
    }
    // Get specific obstacle at grid position
    getObstacleAt(gridX, gridZ) {
        return this.obstaclesList.find(obstacle => {
            const pos = this.worldToGridPosition(obstacle.mesh.position.x, obstacle.mesh.position.z);
            return pos.x === gridX && pos.z === gridZ;
        });
    }
    // Get specific wall at grid position and edge
    getWallAt(gridX, gridZ, edge) {
        return this.wallsList.find(wall => {
            return wall.tile.x === gridX &&
                wall.tile.z === gridZ &&
                wall.edge === edge;
        });
    }
}
