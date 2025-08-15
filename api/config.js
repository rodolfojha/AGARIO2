// Configuración compartida para el sistema (almacenamiento en memoria)
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
    return true;
  }
  return false;
}

// Función para obtener la configuración de la sala actual
function getCurrentRoomSettings() {
  return currentRoomConfig.configs[currentRoomConfig.currentRoom];
}

// Función para recargar configuración (mantiene la configuración en memoria)
function reloadConfig() {
  return currentRoomConfig;
}

module.exports = {
  getCurrentRoomConfig,
  updateRoomConfig,
  getCurrentRoomSettings,
  reloadConfig
};
