// Detect environment and set server URL
const isProduction = window.location.hostname !== 'localhost' &&
                     window.location.hostname !== '127.0.0.1';

export const CONFIG = {
    SERVER_URL: isProduction
        ? 'https://api.libraescape.com'
        : 'http://localhost:3000'
};