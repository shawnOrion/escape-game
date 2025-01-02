

class AStar {
    constructor(params) {
        if (!params) {
            throw new Error('AStar: params object is required');
        }
        // Validate core dependencies
        if (!params.THREE) throw new Error('AStar: THREE dependency is required');
        if (!params.tileMap) throw new Error('AStar: tileMap is required');
        if (!params.settings) throw new Error('AStar: settings object is required');

        // Store dependencies
        this.THREE = params.THREE;
        this.tileMap = params.tileMap;
        this.settings = params.settings;
        this.navMesh = this.tileMap.navMesh;

        // Optional visualization settings
        this.visualizationSettings = {
            pointSize: params.pointSize || 1.5,
            pointColor: params.pointColor || 0xff0000,
            lineColor: params.lineColor || 0xffff00,
            lineWidth: params.lineWidth || 3
        };
        // Initialize visualization group
        this.pathVisual = new this.THREE.Group();
        this.pathVisual.visible = this.settings.controls?.showEnemyPath || false;
        window.WorldScene.add(this.pathVisual);
    }
    findNearestNode(position) {
        if (!position || !this.navMesh || !this.navMesh.points) {
            return null;
        }
        let nearestNode = null;
        let minDistance = Infinity;
        for (const node of this.navMesh.points) {
            if (node) {
                const distance = position.distanceTo(node);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestNode = node;
                }
            }
        }
        return nearestNode;
    }
    heuristic(a, b) {
        if (!a || !b) return Infinity;
        return a.distanceTo(b);
    }
    getNeighbors(node) {
        if (!node || !this.navMesh || !this.navMesh.points) {
            return [];
        }
        const neighbors = [];
        const maxDistance = this.tileMap.tileSize * 1.25;
        for (const point of this.navMesh.points) {
            if (point && point !== node) {
                const distance = node.distanceTo(point);
                if (distance <= maxDistance) {
                    neighbors.push(point);
                }
            }
        }
        return neighbors;
    }
    findPath(start, goal) {
        // Find path between start and goal points
        const startNode = this.findNearestNode(start);
        const goalNode = this.findNearestNode(goal);
        if (!startNode || !goalNode) {
            return null;
            return null;
        }
        const openSet = new Set([startNode]);
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        gScore.set(startNode, 0);
        fScore.set(startNode, this.heuristic(startNode, goalNode));
        while (openSet.size > 0) {
            let current = null;
            let lowestFScore = Infinity;
            for (const node of openSet) {
                const score = fScore.get(node) || Infinity;
                if (score < lowestFScore) {
                    lowestFScore = score;
                    current = node;
                }
            }
            if (current === goalNode) {
                return this.reconstructPath(cameFrom, current);
            }
            openSet.delete(current);
            closedSet.add(current);
            for (const neighbor of this.getNeighbors(current)) {
                if (closedSet.has(neighbor)) continue;
                const tentativeGScore = (gScore.get(current) || 0) + current.distanceTo(neighbor);
                if (!openSet.has(neighbor)) {
                    openSet.add(neighbor);
                } else if (tentativeGScore >= (gScore.get(neighbor) || 0)) {
                    continue;
                }
                cameFrom.set(neighbor, current);
                gScore.set(neighbor, tentativeGScore);
                fScore.set(neighbor, tentativeGScore + this.heuristic(neighbor, goalNode));
            }
        }
        return null;
        return null;
    }
    reconstructPath(cameFrom, current) {
        const path = [current];
        while (cameFrom.has(current)) {
            current = cameFrom.get(current);
            path.unshift(current);
        }

        return path;
    }
    visualizePath(path) {
        // Clear previous visualization
        while (this.pathVisual.children.length > 0) {
            const child = this.pathVisual.children[0];
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
            this.pathVisual.remove(child);
        }
        // Update visibility based on settings
        this.pathVisual.visible = this.settings.controls.showEnemyPath;
        if (!path || path.length < 2) return;
        // Create line visualization
        const points = path.map(point => new this.THREE.Vector3(point.x, point.y + 1, point.z));
        const geometry = new this.THREE.BufferGeometry().setFromPoints(points);
        const material = new this.THREE.LineBasicMaterial({
            color: this.visualizationSettings.lineColor,
            linewidth: this.visualizationSettings.lineWidth
        });
        const line = new this.THREE.Line(geometry, material);
        this.pathVisual.add(line);
        // Add spheres at path points
        const sphereGeometry = new this.THREE.SphereGeometry(
            this.visualizationSettings.pointSize, 8, 8);
        const sphereMaterial = new this.THREE.MeshBasicMaterial({
            color: this.visualizationSettings.pointColor
        });
        points.forEach(point => {
            const sphere = new this.THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.position.copy(point);
            this.pathVisual.add(sphere);
        });
    }
    togglePathVisibility(visible) {
        this.pathVisual.visible = visible;
    }
    dispose() {
        try {
            while (this.pathVisual.children.length > 0) {
                const child = this.pathVisual.children[0];
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
                this.pathVisual.remove(child);
            }
            this.WorldScene.remove(this.pathVisual);
        } catch (error) {
            console.error('Error disposing AStar:', error);
        }
    }
}