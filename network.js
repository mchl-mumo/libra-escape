export class Network {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.playerId = null;
        this.playerColor = null;
        this.connected = false;
    }

    connect(serverUrl = 'http://localhost:3000') {
        //Load socket.io client from CDN
        return new Promise((resolve, reject) => {
            if (typeof io === 'undefined') {
                reject(new Error('Socket.io clent not found'));
                return;
            }

            this.socket = io(serverUrl);

            this.socket.on('connect', () => {
                console.log('Connected to server');
                this.connected = true;
            });


            // Receive initial player data and existing players
            this.socket.on('init', (data) => {
                this.playerId = data.id;
                this.playerColor = data.color;
                console.log(`Assigned ID: ${this.playerId}, Color: ${this.playerColor}`)

                // Set local player data
                this.game.player.color = this.playerColor;
                this.game.player.id = this.playerId;

                // Add existing players
                data.players.forEach(playerData => {
                    if (playerData.id !== this.playerId) {
                        this.game.addRemotePlayer(playerData);
                    }
                });

                resolve(data);
            });

            // New player joined
            this.socket.on('playerJoined', (playerData) => {
                console.log(`Player joined: ${playerData.id}`);
                this.game.addRemotePlayer(playerData);
            });

            // Another player moved
            this.socket.on('playerMoved', (data) => {
                this.game.updateRemotePlayer(data.id, data.x, data.y);
            });

            // Player left
            this.socket.on('playerLeft', (playerId) => {
                console.log(`Player left: ${playerId}`);
                this.game.removeRemotePlayer(playerId);
            });

            // Handle error
            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                reject(error);
            });
        });
    }

    sendPositionUpdate(x, y) {
        if (this.socket && this.connected) {
            this.socket.emit('updatePosition', { x, y });
        }
    }
}