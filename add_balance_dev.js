#!/usr/bin/env node

// add_balance_dev.js - Script para recargar saldo del usuario dev
// Uso: node add_balance_dev.js [amount] [userId]

const fs = require('fs');
const path = require('path');

// Configuración
const DB_PATH = path.join(__dirname, 'database.json');
const DEFAULT_AMOUNT = 100; // $100 por defecto
const DEFAULT_USER_ID = 'dev-user-123'; // Usuario dev por defecto

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(colors[color] + message + colors.reset);
}

function logSuccess(message) {
    log('✅ ' + message, 'green');
}

function logError(message) {
    log('❌ ' + message, 'red');
}

function logInfo(message) {
    log('ℹ️ ' + message, 'blue');
}

function logWarning(message) {
    log('⚠️ ' + message, 'yellow');
}

function logHeader(message) {
    log('\n' + '='.repeat(50), 'cyan');
    log('🚀 ' + message, 'bright');
    log('='.repeat(50), 'cyan');
}

// Función para cargar la base de datos
function loadDatabase() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            logWarning('Base de datos no encontrada. Creando nueva...');
            return {
                users: {},
                transactions: {},
                games: {},
                payments: {}
            };
        }
        
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        logError('Error al cargar la base de datos: ' + error.message);
        process.exit(1);
    }
}

// Función para guardar la base de datos
function saveDatabase(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        logSuccess('Base de datos guardada exitosamente');
    } catch (error) {
        logError('Error al guardar la base de datos: ' + error.message);
        process.exit(1);
    }
}

// Función para crear o actualizar usuario dev
function ensureDevUser(data) {
    if (!data.users[DEFAULT_USER_ID]) {
        logInfo('Creando usuario dev...');
        data.users[DEFAULT_USER_ID] = {
            id: DEFAULT_USER_ID,
            name: 'Dev User',
            email: 'dev@example.com',
            balance_available: 0,
            balance_locked: 0,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
            is_admin: true,
            is_dev: true
        };
        logSuccess('Usuario dev creado');
    }
    return data.users[DEFAULT_USER_ID];
}

// Función principal para agregar balance
function addBalanceDirectly(amountToAdd, userId = DEFAULT_USER_ID) {
    try {
        logHeader('RECARGA DE SALDO - USUARIO DEV');
        
        // Cargar base de datos
        logInfo('Cargando base de datos...');
        const data = loadDatabase();
        
        // Asegurar que existe el usuario dev
        const user = ensureDevUser(data);
        
        // Mostrar balance actual
        logInfo('Balance actual del usuario:');
        log(`  👤 Usuario: ${user.name} (${user.email})`, 'cyan');
        log(`  💰 Disponible: $${user.balance_available.toFixed(2)}`, 'yellow');
        log(`  🔒 Bloqueado: $${user.balance_locked.toFixed(2)}`, 'yellow');
        log(`  📊 Total: $${(user.balance_available + user.balance_locked).toFixed(2)}`, 'yellow');
        
        // Validar monto
        if (amountToAdd <= 0) {
            logError('El monto debe ser mayor a 0');
            return false;
        }
        
        // Agregar balance
        const oldBalance = user.balance_available;
        user.balance_available += amountToAdd;
        user.last_login = new Date().toISOString();
        
        // Guardar el usuario actualizado
        data.users[userId] = user;
        
        // Crear transacción
        const transactionId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        data.transactions[transactionId] = {
            id: transactionId,
            userId: userId,
            type: 'deposit',
            amount: amountToAdd,
            description: 'Balance agregado manualmente - Script de recarga DEV',
            timestamp: new Date().toISOString(),
            metadata: {
                method: 'manual_script',
                admin_action: true,
                script: 'add_balance_dev.js'
            }
        };
        
        // Guardar la base de datos
        saveDatabase(data);
        
        // Mostrar resultados
        logSuccess('¡Balance agregado exitosamente!');
        log('\n📊 Nuevo balance:', 'bright');
        log(`  👤 Usuario ID: ${userId}`, 'cyan');
        log(`  📧 Email: ${user.email}`, 'cyan');
        log(`  💰 Disponible: $${user.balance_available.toFixed(2)}`, 'green');
        log(`  🔒 Bloqueado: $${user.balance_locked.toFixed(2)}`, 'yellow');
        log(`  📊 Total: $${(user.balance_available + user.balance_locked).toFixed(2)}`, 'green');
        log(`  💳 Transacción: ${transactionId}`, 'cyan');
        log(`  📈 Incremento: +$${amountToAdd.toFixed(2)}`, 'green');
        
        return true;
        
    } catch (error) {
        logError('Error: ' + error.message);
        return false;
    }
}

// Función para mostrar ayuda
function showHelp() {
    logHeader('AYUDA - SCRIPT DE RECARGA DEV');
    log('\n📖 Uso:', 'bright');
    log('  node add_balance_dev.js [amount] [userId]', 'cyan');
    log('\n📝 Parámetros:', 'bright');
    log('  amount  - Cantidad a agregar (por defecto: $100)', 'yellow');
    log('  userId  - ID del usuario (por defecto: dev-user-123)', 'yellow');
    log('\n💡 Ejemplos:', 'bright');
    log('  node add_balance_dev.js', 'cyan');
    log('  node add_balance_dev.js 500', 'cyan');
    log('  node add_balance_dev.js 1000 dev-user-123', 'cyan');
    log('\n🔧 Funcionalidades:', 'bright');
    log('  ✅ Crea usuario dev si no existe', 'green');
    log('  ✅ Agrega balance automáticamente', 'green');
    log('  ✅ Registra transacciones', 'green');
    log('  ✅ Muestra balance antes y después', 'green');
}

// Función principal
function main() {
    const args = process.argv.slice(2);
    
    // Mostrar ayuda si se solicita
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        return;
    }
    
    // Parsear argumentos
    let amountToAdd = DEFAULT_AMOUNT;
    let userId = DEFAULT_USER_ID;
    
    if (args.length >= 1) {
        const amount = parseFloat(args[0]);
        if (isNaN(amount) || amount <= 0) {
            logError('Monto inválido. Debe ser un número mayor a 0');
            logInfo('Usando monto por defecto: $' + DEFAULT_AMOUNT);
        } else {
            amountToAdd = amount;
        }
    }
    
    if (args.length >= 2) {
        userId = args[1];
    }
    
    // Ejecutar recarga
    logInfo(`Iniciando recarga de $${amountToAdd} para usuario: ${userId}`);
    const success = addBalanceDirectly(amountToAdd, userId);
    
    if (success) {
        log('\n🎉 ¡Recarga completada exitosamente!', 'bright');
        log('🔄 El usuario puede refrescar la página para ver su nuevo balance', 'cyan');
    } else {
        log('\n💥 La recarga falló', 'red');
        process.exit(1);
    }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
    main();
}

module.exports = { addBalanceDirectly, loadDatabase, saveDatabase };
