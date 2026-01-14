import { 
    PLAYER_WIDTH,
    PLAYER_HEIGHT,
    PLAYER_MAX_SPEED,
    PLAYER_JUMP_VELOCITY,
    PLAYER_GRAVITY,
    INTERPOLATION_FACTOR
} from '../constants.js';

export class Player {
    constructor(game, options = {}){

        // Destructure options with defaults
        const {
            isLocal = true,
            id = null,
            color = 'black',
            x = 0,
            y = null
        } = options;
        
        this.game = game;
        this.id = id;
        this.isLocal = isLocal;
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;
        this.x = x;
        this.y = y ?? this.game.height - this.height; // Default to ground level
        this.vy = 0;
        this.weight = PLAYER_GRAVITY;
        this.image = document.getElementById('player');
        this.speed = 0;
        this.maxSpeed = PLAYER_MAX_SPEED;
        this.color = color;

        // For remote players
        this.targetX = this.x;
        this.targetY = this.y;
    }

    update(input){
        if (this.isLocal) {
            // Local player - handle input
            // horizontal movement
            this.x += this.speed;
            if (input.includes('ArrowRight')) this.speed = this.maxSpeed;
            else if (input.includes('ArrowLeft')) this.speed = -this.maxSpeed;
            else this.speed = 0;
            if (this.x < 0) this.x = 0;
            if (this.x > this.game.width - this.width) this.x = this.game.width - this.width;            
            //vertical movement
            if (input.includes('ArrowUp') && this.onGround()) this.vy -= PLAYER_JUMP_VELOCITY;
            this.y += this.vy;
            if (!this.onGround()) this.vy += this.weight;
            else this.vy = 0;
        } else {
            // Remote player - interpolate position
            this.x += (this.targetX - this.x) * INTERPOLATION_FACTOR;
            this.y += (this.targetY - this.y) * INTERPOLATION_FACTOR;
        }
    }

    setPosition(x, y) {
        // remote players
        this.targetX = x;
        this.targetY = y;
    }

    draw(context){
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
    }
    onGround(){
        return this.y >= this.game.height - this.height;
    }

}