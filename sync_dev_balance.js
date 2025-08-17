#!/usr/bin/env node

// sync_dev_balance.js - Sincronizar balance del usuario dev
// Uso: node sync_dev_balance.js [amount]

const { loadDatabase, saveDatabase } = require('./add_balance_dev.js');

const DEV_USER_ID = 'dev-user-123';

function log(message, color = 'reset') {
    const colors = {
        reset: '\x1b[0m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        red: '\x1b[31m'
    };
    console.log(colors[color] + message + colors.reset);
}

async function syncDevBalance() {
    try {
        console.log('🔄 Sincronizando balance del usuario dev...\n');
        
        // Cargar base de datos
        const data = loadDatabase();
        const user = data.users[DEV_USER_ID];
        
        if (!user) {
            log('❌ Usuario dev no encontrado. Ejecuta primero: node add_balance_dev.js', 'red');
            return;
        }
        
        // Mostrar balance actual
        log('📊 Balance actual del usuario dev:', 'blue');
        log(`  👤 Usuario: ${user.name} (${user.email})`, 'yellow');
        log(`  💰 Disponible: $${user.balance_available.toFixed(2)}`, 'green');
        log(`  🔒 Bloqueado: $${user.balance_locked.toFixed(2)}`, 'yellow');
        log(`  📊 Total: $${(user.balance_available + user.balance_locked).toFixed(2)}`, 'green');
        
        // Crear archivo de configuración para el frontend
        const frontendConfig = {
            devUser: {
                id: user.id,
                name: user.name,
                email: user.email,
                balance_available: user.balance_available,
                balance_locked: user.balance_locked,
                avatar: 'https://via.placeholder.com/50/FF6B6B/FFFFFF?text=D',
                is_dev: true,
                is_admin: true
            },
            lastSync: new Date().toISOString(),
            instructions: {
                login: 'Usar el botón "🛠️ DEV LOGIN" en el juego',
                balance: 'El balance se sincroniza automáticamente',
                note: 'Este archivo se actualiza cada vez que ejecutes sync_dev_balance.js'
            }
        };
        
        // Guardar configuración del frontend
        const fs = require('fs');
        fs.writeFileSync('public/game/js/dev-user-config.json', JSON.stringify(frontendConfig, null, 2));
        
        log('\n✅ Configuración del frontend actualizada:', 'green');
        log('📁 Archivo: public/game/js/dev-user-config.json', 'blue');
        
        // Mostrar instrucciones
        log('\n🎮 Para usar en el juego:', 'blue');
        log('1. Abrir: http://back.pruebatupanel.com', 'yellow');
        log('2. Hacer clic en "🛠️ DEV LOGIN"', 'yellow');
        log('3. El balance se sincronizará automáticamente', 'yellow');
        
        log('\n💡 El usuario dev ahora tiene acceso completo al juego!', 'green');
        
    } catch (error) {
        log('❌ Error sincronizando balance:', 'red');
        console.error(error);
    }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
    syncDevBalance();
}

module.exports = { syncDevBalance };
