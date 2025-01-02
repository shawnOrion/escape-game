
class EnemyAnimationController {
    constructor(params) {
        if (!params) throw new Error('EnemyAnimationController: params is required');
        if (!params.THREE) throw new Error('EnemyAnimationController: THREE is required');
        if (!params.FBXLoader) throw new Error('EnemyAnimationController: FBXLoader is required');
        if (!params.settings) throw new Error('EnemyAnimationController: settings is required');
        if (!params.model) throw new Error('EnemyAnimationController: model is required');
        // Store dependencies
        this.THREE = params.THREE;
        this.FBXLoader = params.FBXLoader;
        this.settings = params.settings;
        this.model = params.model;

        // Initialize properties
        this.mixer = null;
        this.animations = new Map();
        this.currentAnimation = null;
        this.isDeathAnimationPlaying = false;
        if (this.model) {
            this.mixer = new this.THREE.AnimationMixer(this.model);
        }
    }
    async loadAnimation(name, url) {
        if (!this.model) {
            throw new Error('EnemyAnimationController: Model must be set before loading animations');
        }
        if (!url) {
            throw new Error('EnemyAnimationController: Animation URL is required');
        }
        // Initialize mixer if not already done
        if (!this.mixer) {
            this.mixer = new this.THREE.AnimationMixer(this.model);
        }
        try {
            const loader = new this.FBXLoader();
            const animationFBX = await new Promise((resolve, reject) => {
                loader.load(url, resolve, undefined, reject);
            });
            const animation = animationFBX.animations[0];
            if (!animation) {
                throw new Error(`No animation found in file: ${url}`);
            }
            const action = this.mixer.clipAction(animation);
            this.animations.set(name, action);
            console.log(`Animation loaded: ${name}`);
            return action;
        } catch (error) {
            console.error(`Failed to load animation ${name}:`, error);
            throw error;
        }
    }
    async loadAllAnimations() {
        try {
            if (!this.settings?.model?.animations) {
                throw new Error('EnemyAnimationController: No animations found in enemy model settings');
            }
            const modelAnimations = this.settings.model.animations;

            // Load animations if not already loaded
            if (this.animations.size === 0 && modelAnimations) {
                await Promise.all(
                    Object.entries(modelAnimations).map(([name, url]) =>
                        this.loadAnimation(name, url)
                    )
                );
            }
            // Play or restart idle animation
            this.playAnimation('idle');
        } catch (error) {
            console.error('Failed to load animations:', error);
            throw error;
        }
    }
    playAnimation(name) {
        const action = this.animations.get(name);
        if (!action) {
            console.warn(`Animation not found: ${name}`);
            return;
        }
        action.reset();
        action.play();
        this.currentAnimation = name;
    }
    transitionToAnimation(newAnimation) {
        if (this.currentAnimation === newAnimation) return;
        const fadeTime = 0.5;
        const oldAction = this.animations.get(this.currentAnimation);
        const newAction = this.animations.get(newAnimation);
        if (newAction) {
            newAction.reset();
            newAction.play();
            if (oldAction) {
                newAction.crossFadeFrom(oldAction, fadeTime, true);
            }
            this.currentAnimation = newAnimation;
        }
    }

    update(deltaTime) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }
    stopAllAnimations() {
        if (this.mixer) {
            this.mixer.stopAllAction();
        }
    }
    dispose() {
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer.uncacheRoot(this.model);
            this.animations.clear();
            this.mixer = null;
        }
    }
}
