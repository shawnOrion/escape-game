class Crosshair {
    constructor(params) {
        this.params = {
            uiContainer: params.uiContainer,
            color: params.initialColor || '#ffffff',
            size: params.initialSize || 25,
            thickness: params.initialThickness || 2,
            gap: 4,
            outlineScale: 1.75 // Define outline scale as a parameter with increased value
        };
        this.element = document.createElement('div');
        this.init();
    }
    createLine(position) {
        const {
            thickness,
            size,
            gap
        } = this.params;
        const outlineThickness = thickness * this.params.outlineScale;
        const container = document.createElement('div');
        const line = document.createElement('div');
        const isVertical = position === 'top' || position === 'bottom';
        const outlineOffset = (outlineThickness - thickness) / 2;
        Object.assign(container.style, {
            position: 'absolute',
            backgroundColor: 'black',
            ...isVertical ? {
                width: `${outlineThickness}px`,
                height: `${size / 2 - gap}px`,
                left: '50%',
                transform: 'translateX(-50%)',
                [position]: '0'
            } : {
                height: `${outlineThickness}px`,
                width: `${size / 2 - gap}px`,
                top: '50%',
                transform: 'translateY(-50%)',
                [position]: '0'
            }
        });
        Object.assign(line.style, {
            position: 'absolute',
            backgroundColor: this.params.color,
            ...isVertical ? {
                width: `${thickness}px`,
                height: '100%',
                left: `${outlineOffset}px`
            } : {
                height: `${thickness}px`,
                width: '100%',
                top: `${outlineOffset}px`
            }
        });
        container.appendChild(line);
        return container;
    }
    init() {
        Object.assign(this.element.style, {
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: `${this.params.size}px`,
            height: `${this.params.size}px`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
        });
        ['top', 'right', 'bottom', 'left'].forEach(position => {
            this.element.appendChild(this.createLine(position));
        });
        if (this.params.uiContainer) {
            this.params.uiContainer.appendChild(this.element);
        } else {
            console.error('UI container not provided to Crosshair');
        }
    }
    show() {
        this.element.style.display = 'block';
    }
    hide() {
        this.element.style.display = 'none';
    }
    setColor(color) {
        Array.from(this.element.children).forEach(container => {
            container.children[0].style.backgroundColor = color;
        });
    }
    setSize(size) {
        this.params.size = size;
        Object.assign(this.element.style, {
            width: `${size}px`,
            height: `${size}px`
        });
        // Recreate lines with new size
        this.element.innerHTML = '';
        ['top', 'right', 'bottom', 'left'].forEach(position => {
            this.element.appendChild(this.createLine(position));
        });
    }
    setThickness(thickness) {
        this.params.thickness = thickness;
        // Recreate lines with new thickness
        this.element.innerHTML = '';
        ['top', 'right', 'bottom', 'left'].forEach(position => {
            this.element.appendChild(this.createLine(position));
        });
    }
}