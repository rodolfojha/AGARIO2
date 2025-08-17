#!/usr/bin/env node

// Script para iniciar el servidor del juego correcto
require('dotenv').config();

console.log(`🎮 Iniciando servidor del juego en puerto 3001`);
console.log(`🌐 Usando servidor modificado en /home/ubuntu/agar.io-clone/`);

// Cambiar al directorio del juego
process.chdir('/home/ubuntu/agar.io-clone');

// Iniciar el servidor del juego correcto
require('/home/ubuntu/agar.io-clone/src/server/server.js');
