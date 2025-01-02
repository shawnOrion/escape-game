class ModelLoader {
    constructor(params) {
        if (!params) {
            throw new Error('ModelLoader: params object is required');
        }

        // Validate required dependencies
        if (!params.THREE) {
            throw new Error('ModelLoader: THREE is required');
        }
        if (!params.GLTFLoader) {
            throw new Error('ModelLoader: GLTFLoader is required');
        }
        if (!params.FBXLoader) {
            throw new Error('ModelLoader: FBXLoader is required');
        }
        if (!params.OBJLoader) {
            throw new Error('ModelLoader: OBJLoader is required');
        }
        if (!params.LoadingManager) {
            throw new Error('ModelLoader: LoadingManager is required');
        }
        // Store dependencies
        this.THREE = params.THREE;
        this.LoadingManager = params.LoadingManager;

        // Initialize loaders with dependencies
        this.loaders = new Map([
            ['gltf', new params.GLTFLoader(this.LoadingManager)],
            ['glb', new params.GLTFLoader(this.LoadingManager)],
            ['fbx', new params.FBXLoader(this.LoadingManager)],
            ['obj', new params.OBJLoader(this.LoadingManager)]
        ]);

        this.cache = new Map();
    }
    getFileType(url, explicitType = null) {
        if (explicitType) return explicitType.toLowerCase();
        const extension = url.split('.').pop().toLowerCase();
        return extension === 'gltf' ? 'gltf' :
            extension === 'glb' ? 'glb' :
            extension === 'fbx' ? 'fbx' :
            extension === 'obj' ? 'obj' : null;
    }
    processLoadedModel(result, fileType) {
        const processMap = {
            'gltf': () => result.scene,
            'glb': () => result.scene,
            'fbx': () => result,
            'obj': () => result
        };
        return processMap[fileType]?.() || result.scene || result;
    }
    async loadModel(modelData) {
        const {
            url,
            type,
            scale = 1
        } = modelData;
        const cacheKey = `${url}_${scale}`;

        try {
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey).clone();
            }
            const fileType = this.getFileType(url, type);
            const loader = this.loaders.get(fileType);
            if (!loader) {
                throw new Error(`Unsupported model type: ${fileType || 'unknown'}`);
            }
            const result = await new Promise((resolve, reject) => {
                loader.load(
                    url,
                    resolve,
                    (progress) => {
                        const percentage = (progress.loaded / progress.total * 100).toFixed(2);
                        console.log(`Loading ${fileType}: ${percentage}%`);
                    },
                    reject
                );
            });
            const model = this.processLoadedModel(result, fileType);
            if (!model) {
                throw new Error(`Failed to process model: ${url}`);
            }
            model.scale.setScalar(scale);
            this.cache.set(cacheKey, model.clone());
            return model;
        } catch (error) {
            console.error(`Error loading model ${url}:`, error);
            throw error;
        }
    }
}