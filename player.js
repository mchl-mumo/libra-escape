export class Player {
    constructor(game, isLocal = true){
        this.game = game;
        this.id = null;
        this.isLocal = isLocal;
        this.width = 100;
        this.height = 91.3;
        this.x = 0;
        this.y = this.game.height - this.height;
        this.vy = 0;
        this.weight = 1;
        this.image = document.getElementById('player');
        this.speed = 0;
        this.maxSpeed = 10;
        this.color = 'black';

        // For remote players
        this.targetX = 0;
        this.targetY = 0;
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
            if (input.includes('ArrowUp') && this.onGround()) this.vy -= 30;
            this.y += this.vy;
            if (!this.onGround()) this.vy += this.weight;
            else this.vy = 0;
        } else {
            // Remote player - interpolate positon
            this.x += (this.targetX - this.x) * 0.3;
            this.y += (this.targetY - this.y) * 0.3;
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
        // context.drawImage(this.image, 0, 0, this.width, this.height, this.x, this.y, this.width, this.height);
        
    }
    onGround(){
        return this.y >= this.game.height - this.height;
    }

}