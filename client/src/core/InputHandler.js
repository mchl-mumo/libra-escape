const VALID_KEYS = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Enter'];

export class InputHandler {
    constructor() {
        this.keys = [];
        window.addEventListener('keydown', e => {
            if ((VALID_KEYS.includes(e.key)) && !this.keys.includes(e.key)) {
                this.keys.push(e.key);
            }
        });
        window.addEventListener('keyup', e => {
            if (VALID_KEYS.includes(e.key)) {
                const index = this.keys.indexOf(e.key);
                if (index > -1) this.keys.splice(index, 1);
            }    
        });
    }
}