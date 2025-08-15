// game-server/src/room-sync.js - Sincronización de configuración de sala
const config = require('../../config');

// Función para actualizar configuración del servidor desde API
function updateServerConfig(roomConfig) {
    if (!roomConfig) return false;
    
    try {
        // Actualizar dimensiones del juego
        config.gameWidth = roomConfig.width || 3000;
        config.gameHeight = roomConfig.height || 3000;
        
        // Actualizar cantidad de comida y virus
        config.maxFood = roomConfig.foodCount || 2000;
        config.maxVirus = roomConfig.virusCount || 100;
        
        console.log('🎮 Server config updated:', {
            gameWidth: config.gameWidth,
            gameHeight: config.gameHeight,
            maxFood: config.maxFood,
            maxVirus: config.maxVirus
        });
        
        return true;
    } catch (error) {
        console.error('❌ Error updating server config:', error);
        return false;
    }
}

// Función para obtener configuración actual desde API
async function loadRoomConfigFromAPI() {
    try {
        const apiBase = process.env.API_BASE || 'http://localhost:3000';
        const fetch = require('node-fetch');
        
        const response = await fetch(`${apiBase}/api/admin/room-config`);
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.config && data.config.currentRoom) {
                const roomSettings = data.config.configs[data.config.currentRoom];
                return updateServerConfig(roomSettings);
            }
        }
        
        console.log('ℹ️ Using default server config');
        return false;
    } catch (error) {
        console.log('ℹ️ Could not load room config from API, using defaults');
        return false;
    }
}

module.exports = {
    updateServerConfig,
    loadRoomConfigFromAPI
};
