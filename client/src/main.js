import { InputHandler } from './core/InputHandler.js';
import { Player } from './entities/Player.js';
import { Network } from './network/NetworkClient.js';
import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';

window.addEventListener('load', function() {
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    class Game {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.player = new Player(this, { isLocal: true });
            this.remotePlayers = new Map();
            this.input = new InputHandler();
            this.network = new Network(this);
        }

        addRemotePlayer(playerData) {
            const remotePlayer = new Player(this, {
                isLocal: false,
                id: playerData.id,
                color: playerData.color,
                x: playerData.x,
                y: playerData.y
            });
            this.remotePlayers.set(playerData.id, remotePlayer);
        }

        updateRemotePlayer(id, x, y) {
            const player = this.remotePlayers.get(id);
            if (player) {
                player.setPosition(x, y);
            }
        }

        removeRemotePlayer(id) {
            this.remotePlayers.delete(id);
        }

        update(){
            // Update local player
            this.player.update(this.input.keys);

            // Send position to server
            this.network.sendPositionUpdate(this.player.x, this.player.y);

            // Update remote players
            this.remotePlayers.forEach(remotePlayer => {
                remotePlayer.update([]);
            });
        }
        draw(context){
            // Draw local player
            this.player.draw(context);

            // Draw all remote players
            this.remotePlayers.forEach(remotePlayer => {
                remotePlayer.draw(context);
            });
        }
    }

    const game = new Game(canvas.width, canvas.height);

    // Connect to server
    game.network.connect('http://localhost:3000')
        .then(() => console.log('Connected and ready!'))
        .catch(err => console.log('Running in offline mode:', err.message));

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.update();
        game.draw(ctx);
        requestAnimationFrame(animate);
    }
    animate();
});