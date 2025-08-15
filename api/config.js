const fs = require('fs');
const path = require('path');

// Ruta del archivo de configuración
const CONFIG_FILE = path.join(__dirname, 'room-config.json');

// Configuración por defecto
const DEFAULT_CONFIG = {
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

// Función para cargar configuración desde archivo
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      const config = JSON.parse(data);
      console.log('📁 Configuración cargada desde archivo:', config.currentRoom);
      return config;
    } else {
      console.log('📁 Archivo de configuración no existe, usando configuración por defecto');
      return DEFAULT_CONFIG;
    }
  } catch (error) {
    console.error('❌ Error cargando configuración:', error);
    return DEFAULT_CONFIG;
  }
}

// Función para guardar configuración en archivo
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log('💾 Configuración guardada en archivo:', config.currentRoom);
    return true;
  } catch (error) {
    console.error('❌ Error guardando configuración:', error);
    return false;
  }
}

// Variable global para la configuración actual
let currentRoomConfig = loadConfig();

// Función para obtener la configuración actual
function getCurrentRoomConfig() {
  return currentRoomConfig;
}

// Función para actualizar la configuración
function updateRoomConfig(roomType) {
  if (['small', 'medium', 'large'].includes(roomType)) {
    currentRoomConfig.currentRoom = roomType;
    const saved = saveConfig(currentRoomConfig);
    if (saved) {
      console.log('🎮 Room config updated to:', roomType);
      return true;
    } else {
      console.error('❌ Failed to save room config');
      return false;
    }
  }
  return false;
}

// Función para obtener la configuración de la sala actual
function getCurrentRoomSettings() {
  return currentRoomConfig.configs[currentRoomConfig.currentRoom];
}

// Función para recargar configuración desde archivo
function reloadConfig() {
  currentRoomConfig = loadConfig();
  return currentRoomConfig;
}

module.exports = {
  getCurrentRoomConfig,
  updateRoomConfig,
  getCurrentRoomSettings,
  reloadConfig
};
