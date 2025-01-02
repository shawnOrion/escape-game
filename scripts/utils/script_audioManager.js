
class AudioManager {
    constructor(params) {
        if (!params) {
            throw new Error('AudioManager: params object is required');
        }
        // Validate required dependencies
        if (!params.THREE) {
            throw new Error('AudioManager: THREE dependency is required');
        }
        if (!params.camera) {
            throw new Error('AudioManager: camera is required');
        }
        if (!params.LoadingManager) {
            throw new Error('AudioManager: LoadingManager is required');
        }
        if (!params.soundAssets) {
            throw new Error('AudioManager: soundAssets configuration is required');
        }
        // Store dependencies
        this.THREE = params.THREE;
        this.camera = params.camera;
        this.LoadingManager = params.LoadingManager;
        this.soundAssets = params.soundAssets;
        // Initialize audio system
        this.listener = new this.THREE.AudioListener();
        this.sounds = new Map();
        this.audioLoader = new this.THREE.AudioLoader(this.LoadingManager);
        // Add listener to camera
        if (this.camera) {
            this.camera.add(this.listener);
        }
    }
    async loadSound(key, url, volume = 1) {
        try {
            return new Promise((resolve, reject) => {
                // Check if sound is already loaded
                if (this.sounds.has(key)) {
                    resolve(this.sounds.get(key));
                    return;
                }
                if (!url) {
                    reject(new Error(`Invalid URL for sound: ${key}`));
                    return;
                }
                this.audioLoader.load(url,
                    (buffer) => {
                        try {
                            const sound = new this.THREE.Audio(this.listener);
                            sound.setBuffer(buffer);
                            sound.setVolume(volume);
                            this.sounds.set(key, sound);
                            console.log(`Loaded sound: ${key}`);
                            resolve(sound);
                        } catch (error) {
                            console.error(`Error creating sound ${key}:`, error);
                            reject(error);
                        }
                    },
                    (progress) => {
                        // Optional progress callback
                        console.debug(`Loading sound ${key}: ${Math.round(progress.loaded / progress.total * 100)}%`);
                    },
                    (error) => {
                        console.error(`Error loading sound ${key}:`, error);
                        reject(error);
                    }
                );
            });
        } catch (error) {
            console.error(`Unexpected error loading sound ${key}:`, error);
            throw error;
        }
    }
    async loadSoundAssets() {
        try {
            const loadPromises = [];
            // Load all sound categories
            for (const category in this.soundAssets) {
                for (const soundKey in this.soundAssets[category]) {
                    const sound = this.soundAssets[category][soundKey];
                    if (!sound || !sound.url || !sound.key) {
                        console.warn(`Invalid sound configuration for ${category}.${soundKey}`);
                        continue;
                    }
                    loadPromises.push(
                        this.loadSound(sound.key, sound.url, sound.volume)
                        .catch(error => {
                            console.error(`Failed to load sound ${soundKey}:`, error);
                            return null; // Continue loading other sounds
                        })
                    );
                }
            }
            const results = await Promise.all(loadPromises);
            const loadedCount = results.filter(result => result !== null).length;
            console.log(`Successfully loaded ${loadedCount}/${loadPromises.length} sounds`);
            return results.filter(result => result !== null);
        } catch (error) {
            console.error('Error loading sound assets:', error);
            throw error;
        }
    }
    play(key) {
        const sound = this.sounds.get(key);
        if (sound) {
            if (sound.isPlaying) {
                sound.stop();
            }
            sound.play();
        } else {
            console.warn(`Sound ${key} not found`);
        }
    }
    stop(key) {
        const sound = this.sounds.get(key);
        if (sound && sound.isPlaying) {
            sound.stop();
        }
    }
    stopAll() {
        this.sounds.forEach(sound => {
            if (sound.isPlaying) {
                sound.stop();
            }
        });
    }
    setVolume(key, volume) {
        const sound = this.sounds.get(key);
        if (sound) {
            sound.setVolume(Math.max(0, Math.min(1, volume)));
        }
    }
    dispose() {
        this.sounds.forEach(sound => {
            sound.stop();
            if (sound.buffer) {
                sound.buffer.dispose();
            }
        });
        this.sounds.clear();
    }
}