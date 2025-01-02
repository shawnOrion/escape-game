class ImageLoader {
    constructor(params = {}) {
        // Validate required dependencies
        const required = ['LoadingManager', 'IMAGE_ASSETS'];
        for (const prop of required) {
            if (!params[prop]) {
                throw new Error(`ImageLoader: ${prop} is required`);
            }
        }
        // Store dependencies
        this.LoadingManager = params.LoadingManager;
        this.IMAGE_ASSETS = params.IMAGE_ASSETS;
        // Initialize internal state
        this.images = new Map();
        this.loadingState = {
            inProgress: false,
            error: null,
            totalImages: Object.keys(this.IMAGE_ASSETS).length,
            loadedImages: 0
        };
    }
    loadImage(key, imageData) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                // Apply settings from imageData
                if (imageData.scale && imageData.scale !== 1.0) {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width * imageData.scale;
                    canvas.height = img.height * imageData.scale;

                    if (imageData.flipX) {
                        ctx.scale(-1, 1);
                        ctx.translate(-canvas.width, 0);
                    }

                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    img.src = canvas.toDataURL();
                }
                this.images.set(key, {
                    element: img,
                    settings: imageData
                });
                resolve(img);
            };
            img.onerror = (error) => {
                console.error(`Failed to load image: ${imageData.url}`);
                reject(error);
            };
            img.src = imageData.url;
        });
    }
    async loadAllImages() {
        if (this.loadingState.inProgress) {
            throw new Error('Image loading already in progress');
        }
        this.loadingState.inProgress = true;
        this.loadingState.error = null;
        this.loadingState.loadedImages = 0;
        try {
            const loadPromises = Object.entries(this.IMAGE_ASSETS).map(([key, imageData]) =>
                this.loadImage(key, imageData).then(() => {
                    this.loadingState.loadedImages++;
                    if (this.LoadingManager.onProgress) {
                        this.LoadingManager.onProgress(
                            imageData.url,
                            this.loadingState.loadedImages,
                            this.loadingState.totalImages
                        );
                    }
                })
            );
            await Promise.all(loadPromises);
            console.log('All images loaded successfully');
        } catch (error) {
            this.loadingState.error = error;
            console.error('Error loading images:', error);
            throw new Error(`Failed to load images: ${error.message}`);
        } finally {
            this.loadingState.inProgress = false;
        }
    }
    getImage(key) {
        const imageData = this.images.get(key);
        if (!imageData) {
            console.warn(`Image with key "${key}" not found.`);
            return null;
        }
        return imageData.element;
    }
    getImageSettings(key) {
        const imageData = this.images.get(key);
        if (!imageData) {
            console.warn(`Image settings for key "${key}" not found.`);
            return null;
        }
        return imageData.settings;
    }
    dispose(key) {
        if (this.images.has(key)) {
            const imageData = this.images.get(key);
            imageData.element.src = '';
            this.images.delete(key);
        }
    }
    disposeAll() {
        for (const [key] of this.images) {
            this.dispose(key);
        }
        this.images.clear();
    }
}