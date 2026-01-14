import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

// Create express server and socket.io server
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    }
});

// Store all connected players
const players = new Map();

io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Create new player
    const playerData = {
        id: socket.id,
        x: Math.random() * 400,
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
        io.emit('playerLeft', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});