# Project File Structure: Scripts

This document provides a quick overview of the `scripts` directory and its contents.

---

## Folders and Files

### `enemy/`
- `script_astar.js`: Implements A* pathfinding for enemy movement.
- `script_enemyAnimationController.js`: Handles enemy animations and their transitions.
- `script_particleEffect.js`: Manages particle effect for enemy death.

---

### `fps/`
- `script_cameraController.js`: Controls the player camera in the FPS setup.
- `script_gunController.js`: Core logic for gun functionality.
- `script_gunManager.js`: Manages gun selection and behavior.
- `script_gunMount.js`: Handles gun mounting mechanics.
- `script_inputHandler.js`: Processes player input and actions.
- `script_ray.js`: Implements raycasting for shooting mechanics.
- `script_gun.js`: Handles the rendering and usage of any gun 

---

### `prompts/`
- `createModularClass.md`: Documentation or planning file for modular class creation.

---

### `ui/`
- `script_ammoDisplay.js`: Displays the player's current ammunition count.
- `script_crosshair.js`: Manages crosshair visuals.
- `script_gunHUDContainer.js`: Contains gun-related HUD elements.
- `script_gunLoadoutPanel.js`: Displays and manages gun loadout options.
- `script_hud.js`: Handles the general heads-up display.

---

### `utils/`
- `script_audioManager.js`: Manages game audio and sound effects.
- `script_imageLoader.js`: Loads and processes images for the game.
- `script_modelLoader.js`: Handles 3D model loading and setup.

---

### `world/`
- `script_mapGen.js`: Generates the dungeon map layout.
- `script_navmesh.js`: Builds and maintains navigation meshes for AI movement.
- `script_obstacle.js`: Defines and manages obstacles in the game world.
- `script_skybox.js`: Sets up the skybox for the game environment.
- `script_tile.js`: Represents individual tiles in the dungeon.
- `script_tilemap.js`: Creates and manages the dungeon's tilemap.
- `script_wall.js`: Defines and handles wall structures in the game.
