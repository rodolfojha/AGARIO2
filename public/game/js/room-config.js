// public/game/js/room-config.js - Configuraciones de sala para el administrador

// Configuraciones de sala disponibles
const ROOM_CONFIGS = {
    small: {
        name: 'Sala Pequeña',
        dimensions: '2000x2000',
        capacity: '20-30 jugadores',
        width: 2000,
        height: 2000,
        maxPlayers: 30,
        foodCount: 1000,
        virusCount: 50,
        description: 'Ideal para partidas rápidas y competitivas'
    },
    medium: {
        name: 'Sala Mediana',
        dimensions: '3000x3000',
        capacity: '50-80 jugadores',
        width: 3000,
        height: 3000,
        maxPlayers: 80,
        foodCount: 2000,
        virusCount: 100,
        description: 'Balance entre velocidad y espacio'
    },
    large: {
        name: 'Sala Grande',
        dimensions: '4000x4000',
        capacity: '100-150 jugadores',
        width: 4000,
        height: 4000,
        maxPlayers: 150,
        foodCount: 3500,
        virusCount: 200,
        description: 'Para partidas épicas con muchos jugadores'
    }
};

// Configuración actual (por defecto: medium)
let currentRoomConfig = 'medium';

// Función para obtener la configuración actual
function getCurrentRoomConfig() {
    return ROOM_CONFIGS[currentRoomConfig];
}

// Función para cambiar la configuración de sala
async function setRoomConfig(configKey) {
    if (!ROOM_CONFIGS[configKey]) {
        console.error('❌ Configuración de sala inválida:', configKey);
        return false;
    }
    
    try {
        const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:3000' : `http://${window.location.hostname}`;
        const response = await fetch(apiBase + '/api/admin/room-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (window.authManager ? window.authManager.token : '')
            },
            body: JSON.stringify({
                roomSize: configKey,
                ...ROOM_CONFIGS[configKey]
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                currentRoomConfig = configKey;
                console.log('✅ Configuración de sala actualizada:', ROOM_CONFIGS[configKey].name);
                return true;
            }
        }
        
        console.error('❌ Error al actualizar configuración de sala');
        return false;
    } catch (error) {
        console.error('❌ Error de conexión al actualizar configuración:', error);
        return false;
    }
}

// Función para cargar la configuración actual desde el servidor
async function loadRoomConfig() {
    try {
        const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:3000' : `http://${window.location.hostname}`;
        const response = await fetch(apiBase + '/api/admin/room-config', {
            headers: {
                'Authorization': 'Bearer ' + (window.authManager ? window.authManager.token : '')
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success && result.roomSize && ROOM_CONFIGS[result.roomSize]) {
                currentRoomConfig = result.roomSize;
                console.log('✅ Configuración de sala cargada:', ROOM_CONFIGS[currentRoomConfig].name);
                return true;
            }
        }
        
        console.log('ℹ️ Usando configuración por defecto (medium)');
        return false;
    } catch (error) {
        console.log('ℹ️ Error al cargar configuración, usando por defecto');
        return false;
    }
}

// Función para obtener las dimensiones del juego según la configuración actual
function getGameDimensions() {
    const config = getCurrentRoomConfig();
    return {
        width: config.width,
        height: config.height
    };
}

// Función para obtener el máximo de jugadores según la configuración actual
function getMaxPlayers() {
    const config = getCurrentRoomConfig();
    return config.maxPlayers;
}

// Función para obtener la cantidad de comida según la configuración actual
function getFoodCount() {
    const config = getCurrentRoomConfig();
    return config.foodCount;
}

// Función para obtener la cantidad de virus según la configuración actual
function getVirusCount() {
    const config = getCurrentRoomConfig();
    return config.virusCount;
}

// Función para obtener información de la configuración actual
function getRoomInfo() {
    const config = getCurrentRoomConfig();
    return {
        name: config.name,
        dimensions: config.dimensions,
        capacity: config.capacity,
        maxPlayers: config.maxPlayers,
        description: config.description
    };
}

// Función para verificar si el usuario es administrador
async function checkAdminStatus() {
    try {
        const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:3000' : `http://${window.location.hostname}`;
        const response = await fetch(apiBase + '/api/admin/check-status', {
            headers: {
                'Authorization': 'Bearer ' + (window.authManager ? window.authManager.token : '')
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.isAdmin || false;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Error al verificar estado de administrador:', error);
        return false;
    }
}

// Exportar funciones para uso global
window.RoomConfig = {
    ROOM_CONFIGS,
    getCurrentRoomConfig,
    setRoomConfig,
    loadRoomConfig,
    getGameDimensions,
    getMaxPlayers,
    getFoodCount,
    getVirusCount,
    getRoomInfo,
    checkAdminStatus
};

// Cargar configuración al inicializar
document.addEventListener('DOMContentLoaded', function() {
    loadRoomConfig();
});

console.log('🎮 Room Config loaded - Available configs:', Object.keys(ROOM_CONFIGS));
