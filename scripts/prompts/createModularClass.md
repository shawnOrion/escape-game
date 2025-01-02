<!-- outdated -->
<!-- todo later: use window object to expose imports, such as Three.js, to modular classes; this way, don't have to pass the reference to the modular class -->

## Refactor of ___ class
    - we are making the class able to be moved to external script 
    - create a 'params' object passed to constructor
        - refer to other classes modules which are attached to the window object scope via  window object eg. window.WorldScene
        - otherwise other global const , like app settings, lcasses and modules like Imports eg. Three, and children classes eg. the enemy , should be passed as params. create self contained references to the params via 'this'
    - add better error handling for missing dependencies
    - update the instantation of the class to make sure that it's instantiated with the correct parameters

## Script asset
- Add the script to our script assets. script: @

