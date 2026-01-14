import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

// Game constants
const GAME_WIDTH = 500;
const GAME_HEIGHT = 500;
const PLAYER_WIDTH = 100;
const PLAYER_HEIGHT = 91.3;
const UPDATE_RATE_LIMIT = 50; // Minimum ms between updates (50ms = 50hz = 20fps = 20 updates per second)


// Create express server and socket.io server
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        // TODO: Restrict to specific origins in production
        // Example: origin: "https://frontend-url.com"
        origin: "*",
        methods: ["GET", "POST"],
    }
});

// Store all connected players
const players = new Map();

// Track last update time for each player
const lastUpdateTime = new Map();

// Data validation
function isValidPosition(data) {
    if (!data || typeof data !== 'object') return false;

    const {x, y} = data;

    if (typeof x !== 'number' || typeof y !== 'number') return false;

    if (!Number.isFinite(x) || !Number.isFinite(y)) return false;

    if (x < 0 || x > GAME_WIDTH - PLAYER_WIDTH || y < 0 || y > GAME_HEIGHT - PLAYER_HEIGHT) return false; 

    return true;
}

io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Create new player
    const playerData = {
        id: socket.id,
        x: Math.random() * (GAME_WIDTH - PLAYER_WIDTH), // Random x and y position to spawn
        y: 0,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
    };

    players.set(socket.id, playerData);

    // Send the new player their id, color and other players
    socket.emit('init' , {
        id: socket.id,
        color: playerData.color,
        players: Array.from(players.values())
    });

    // Broadcast player join to all other players
    socket.broadcast.emit('playerJoined', playerData);

    // Handle position updates
    socket.on('updatePosition', (data) => {

        // Rate limiting
        const now = Date.now();
        const lastUpdate = lastUpdateTime.get(socket.id) || 0;
        if (now - lastUpdate < UPDATE_RATE_LIMIT) return;
        lastUpdateTime.set(socket.id, now);

        // Validate data
        if (!isValidPosition(data)) {
            console.warn(`Invalid position data from ${socket.id}:`, data);
            return;
        }

        const player = players.get(socket.id);
        if (player) {
            player.x = data.x;
            player.y = data.y;

            // Broadcast position updates
            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                x: data.x,
                y: data.y,
            });
        }
    });
    // Handle player disconnection
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        players.delete(socket.id);
        lastUpdateTime.delete(socket.id);
        io.emit('playerLeft', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});