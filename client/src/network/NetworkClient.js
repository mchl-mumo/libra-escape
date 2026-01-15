export class Network {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.playerId = null;
        this.playerColor = null;
        this.connected = false;

        // Reconnection settings
        this.serverUrl = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.baseReconnectDelay = 1000; // 1 second
        this.maxReconnectDelay = 30000; // 30 seconds
        this.reconnectTimeoutId = null;
    }

    isValidInitData(data) {
        return data && 
            typeof data === 'object' &&
            typeof data.id === 'string' &&
            typeof data.color === 'string' &&
            Array.isArray(data.players);
    }

    isValidPlayerData(data) {
        return data &&
            typeof data === 'object' &&
            typeof data.id === 'string' &&
            typeof data.x === 'number' &&
            typeof data.y === 'number' &&
            Number.isFinite(data.x) &&
            Number.isFinite(data.y);
    }

    isValidPositionUpdate(data) {
        return data &&
            typeof data === 'object' &&
            typeof data.id === 'string' &&
            typeof data.x === 'number' &&
            typeof data.y === 'number' &&
            Number.isFinite(data.x) &&
            Number.isFinite(data.y);
    }

    connect(serverUrl = 'http://localhost:3000') {
        this.serverUrl = serverUrl;
        // Clear socket connection before creating a new one
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }

        this.game.remotePlayers.clear();

        //Load socket.io client from CDN
        return new Promise((resolve, reject) => {
            if (typeof io === 'undefined') {
                reject(new Error('Socket.io client not found'));
                return;
            }

            // Connection timeout
            const CONNECTION_TIMEOUT = 5000;
            const timeoutId = setTimeout(() => {
                reject(new Error('Connection timed out'));
            }, CONNECTION_TIMEOUT);

            this.socket = io(serverUrl, {
                reconnection: false // Disable automatic reconnection
            });

            this.socket.on('connect', () => {
                console.log('Connected to server');
                this.connected = true;
                this.reconnectAttempts = 0;
            });

            // Receive initial player data and existing players
            this.socket.on('init', (data) => {
                clearTimeout(timeoutId); // successful connection, clear timeout

                // Validate initial data
                if (!this.isValidInitData(data)) {
                    console.error('Invalid init data received:', data);
                    reject(new Error('Invalid init data from server'));
                    return;
                }
                
                this.playerId = data.id;
                this.playerColor = data.color;
                console.log(`Assigned ID: ${this.playerId}, Color: ${this.playerColor}`)

                // Set local player data
                this.game.player.color = this.playerColor;
                this.game.player.id = this.playerId;

                // Add existing players
                data.players.forEach(playerData => {
                    if (playerData.id !== this.playerId) {
                        // Validate player data
                        if (this.isValidPlayerData(playerData)) {
                            this.game.addRemotePlayer(playerData);
                        } else {
                            console.warn('Skipping invalid player data:', playerData);
                        }                     
                    }
                });

                resolve(data);
            });

            // New player joined
            this.socket.on('playerJoined', (playerData) => {
                // Validate player data
                if (!this.isValidPlayerData(playerData)) {
                    console.warn('Invalid playerJoined data:', playerData);
                    return;
                }
                // Prevent duplication
                if (!this.game.remotePlayers.has(playerData.id)) {
                    console.log(`Player joined: ${playerData.id}`);
                    this.game.addRemotePlayer(playerData);
                }
            });

            // Another player moved
            this.socket.on('playerMoved', (data) => {
                // Validate playerMoved data
                if (!this.isValidPositionUpdate(data)) {
                    console.warn('Invalid playerMoved data:', data);
                    return;
                }
                this.game.updateRemotePlayer(data.id, data.x, data.y);
            });

            // Player left
            this.socket.on('playerLeft', (playerId) => {
                // Validate playerId
                if (typeof playerId !== 'string') {
                    console.warn('Invalid playerLeft data:', playerId);
                    return;
                }
                console.log(`Player left: ${playerId}`);
                this.game.removeRemotePlayer(playerId);
            });

            // Handle disconnection - attempt to reconnect
            this.socket.on('disconnect', (reason) => {
                console.log('Disconnected:', reason);
                this.connected = false;

                // Don't attempt to reconnect if disconnected intentionally
                if (reason !== 'io server disconnect') {
                    this.attemptReconnect();
                }
            });

            // Handle error
            this.socket.on('connect_error', (error) => {
                clearTimeout(timeoutId);
                console.error('Connection error:', error);
                this.connected = false;
                reject(error);
            });
        });
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnection attempts reached. Giving up.');
            return;
        }

        this.reconnectAttempts++;

        // Calculate delay with exponential backoff
        const delay = Math.min(
            this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
            this.maxReconnectDelay
        );

        console.log(`Reconnecting in ${delay/1000} seconds... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        this.reconnectTimeoutId = setTimeout(() => {
            console.log('Attempting to reconnect... ');
            this.connect(this.serverUrl)
                .then(() => console.log('Reconnected successfully!'))
                .catch(() => {
                    // try again
                    this.attemptReconnect();
                });
        }, delay);
    }

    sendPositionUpdate(x, y) {
        if (this.socket && this.connected) {
            this.socket.emit('updatePosition', { x, y });
        }
    }
}