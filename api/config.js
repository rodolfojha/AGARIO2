// Configuración compartida para el sistema
let currentRoomConfig = {
  currentRoom: 'medium',
  configs: {
    small: {
      name: 'Sala Pequeña',
      width: 1000,
      height: 1000,
      maxPlayers: 10,
      foodCount: 100,
      virusCount: 5
    },
    medium: {
      name: 'Sala Mediana',
      width: 2000,
      height: 2000,
      maxPlayers: 25,
      foodCount: 200,
      virusCount: 10
    },
    large: {
      name: 'Sala Grande',
      width: 3000,
      height: 3000,
      maxPlayers: 50,
      foodCount: 300,
      virusCount: 15
    }
  }
};

// Función para obtener la configuración actual
function getCurrentRoomConfig() {
  return currentRoomConfig;
}

// Función para actualizar la configuración
function updateRoomConfig(roomType) {
  if (['small', 'medium', 'large'].includes(roomType)) {
    currentRoomConfig.currentRoom = roomType;
    console.log('🎮 Room config updated to:', roomType);
    
    // Guardar en una variable global que persista
    global.roomConfig = currentRoomConfig;
    
    return true;
  }
  return false;
}

// Función para obtener la configuración de la sala actual
function getCurrentRoomSettings() {
  return currentRoomConfig.configs[currentRoomConfig.currentRoom];
}

// Función para recargar configuración
function reloadConfig() {
  // Si hay configuración guardada globalmente, usarla
  if (global.roomConfig) {
    currentRoomConfig = global.roomConfig;
    console.log('🔄 Configuración recargada desde memoria global:', currentRoomConfig.currentRoom);
  }
  return currentRoomConfig;
}

// Función para establecer configuración desde el cliente
function setConfigFromClient(config) {
  if (config && config.currentRoom && ['small', 'medium', 'large'].includes(config.currentRoom)) {
    currentRoomConfig.currentRoom = config.currentRoom;
    global.roomConfig = currentRoomConfig;
    console.log('📱 Configuración establecida desde cliente:', config.currentRoom);
    return true;
  }
  return false;
}

module.exports = {
  getCurrentRoomConfig,
  updateRoomConfig,
  getCurrentRoomSettings,
  reloadConfig,
  setConfigFromClient
};
