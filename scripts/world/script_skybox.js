
class SkyBox {
    constructor(params) {
        this.validateParams(params);

        this.params = {
            THREE: params.THREE,
            GLTFLoader: params.GLTFLoader,
            LoadingManager: params.LoadingManager,
            BasicSkyShader: params.BasicSkyShader,
            scene: params.scene,
            settings: params.settings,
            getLights: params.getLights
        };
        this.skyMesh = null;
        this.shaderMaterial = null;

        this.loadSkyboxModel().catch(error => {
            console.error('Failed to load skybox model:', error);
        });
    }
    validateParams(params) {
        const required = [
            'THREE',
            'GLTFLoader',
            'LoadingManager',
            'BasicSkyShader',
            'scene',
            'settings',
            'getLights'
        ];
        const missing = required.filter(param => !params[param]);
        if (missing.length > 0) {
            throw new Error(`SkyBox missing required parameters: ${missing.join(', ')}`);
        }
    }
    async loadSkyboxModel() {
        try {
            const loader = new this.params.GLTFLoader(this.params.LoadingManager);
            const gltf = await new Promise((resolve, reject) => {
                loader.load(
                    'https://play.rosebud.ai/assets/SkyboxSphere.glb?BkJ1',
                    resolve,
                    undefined,
                    reject
                );
            });
            if (!gltf.scene || !gltf.scene.children[0]) {
                throw new Error('Invalid skybox model structure');
            }
            this.skyMesh = gltf.scene.children[0];
            this.skyMesh.scale.set(1500, 1200, 1500);
            const skyColor = new this.params.THREE.Color(this.params.settings.world.defaults.skyColor);
            const groundColor = new this.params.THREE.Color(this.params.settings.world.defaults.groundColor);

            this.shaderMaterial = this.params.BasicSkyShader(skyColor, groundColor);
            if (!this.shaderMaterial || !this.shaderMaterial.material) {
                throw new Error('Failed to create shader material');
            }
            this.skyMesh.material = this.shaderMaterial.material;
            this.params.scene.add(this.skyMesh);

            console.log('Skybox created with default colors:', skyColor, groundColor);
            this.updateSunPosition();
        } catch (error) {
            console.error('Error in loadSkyboxModel:', error);
            throw error;
        }
    }
    update(deltaTime) {
        if (!this.skyMesh) return;

        try {
            this.skyMesh.position.set(0, 0, 0);
        } catch (error) {
            console.error('Error updating skybox position:', error);
        }
    }
    updateSunPosition() {
        if (!this.shaderMaterial) {
            console.warn('Shader material not initialized');
            return;
        }
        try {
            const sunLight = this.params.getLights('sunLight');
            if (!sunLight) {
                console.warn('Sun light not found');
                return;
            }
            const sunDirection = new this.params.THREE.Vector3();
            sunLight.getWorldDirection(sunDirection);
            this.shaderMaterial.setSunPosition(sunDirection);
        } catch (error) {
            console.error('Error updating sun position:', error);
        }
    }
    getSkyColor() {
        if (!this.shaderMaterial) {
            console.warn('Shader material not initialized');
            return new this.params.THREE.Color(0x87CEEB);
        }
        return this.shaderMaterial.getSkyColor();
    }
    getGroundColor() {
        if (!this.shaderMaterial) {
            console.warn('Shader material not initialized');
            return new this.params.THREE.Color(0xFFFFFF);
        }
        return this.shaderMaterial.getGroundColor();
    }
    setSkyColor(color) {
        if (!this.shaderMaterial) {
            console.warn('Cannot set sky color: Shader material not initialized');
            return;
        }
        try {
            this.shaderMaterial.setSkyColor(new this.params.THREE.Color(color));
        } catch (error) {
            console.error('Error setting sky color:', error);
        }
    }
    setGroundColor(color) {
        if (!this.shaderMaterial) {
            console.warn('Cannot set ground color: Shader material not initialized');
            return;
        }
        try {
            this.shaderMaterial.setGroundColor(new this.params.THREE.Color(color));
        } catch (error) {
            console.error('Error setting ground color:', error);
        }
    }
}