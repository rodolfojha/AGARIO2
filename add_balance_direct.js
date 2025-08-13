// Script directo para agregar $100 al usuario victoradrian95@gmail.com
// Este script modifica directamente la base de datos

const fs = require('fs');
const path = require('path');

// Ruta al archivo de la base de datos
const DB_PATH = path.join(__dirname, 'api', 'lib', 'database.json');

function addBalanceDirectly() {
    try {
        console.log('📁 Leyendo base de datos...');
        
        // Leer el archivo de la base de datos
        let data;
        if (fs.existsSync(DB_PATH)) {
            const rawData = fs.readFileSync(DB_PATH, 'utf8');
            data = JSON.parse(rawData);
        } else {
            console.log('📝 Creando nueva base de datos...');
            data = { users: {}, games: {}, transactions: {} };
        }
        
        console.log('🔍 Buscando usuario victoradrian95@gmail.com...');
        
        // Buscar el usuario por email
        let userId = null;
        let user = null;
        
        for (const [id, userData] of Object.entries(data.users)) {
            if (userData.email === 'victoradrian95@gmail.com') {
                userId = id;
                user = userData;
                break;
            }
        }
        
        if (!user) {
            console.log('👤 Usuario no encontrado, creando nuevo usuario...');
            userId = 'google-' + Date.now() + '-victoradrian95';
            user = {
                id: userId,
                email: 'victoradrian95@gmail.com',
                name: 'Victor Adrian',
                balance_available: 0,
                balance_locked: 0,
                created_at: new Date().toISOString(),
                last_login: new Date().toISOString()
            };
        }
        
        console.log('💰 Balance actual:', {
            disponible: user.balance_available,
            bloqueado: user.balance_locked
        });
        
        // Agregar $100
        const amountToAdd = 100;
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
            description: 'Balance agregado manualmente - Script de recarga',
            timestamp: new Date().toISOString(),
            metadata: {
                method: 'manual_script',
                admin_action: true
            }
        };
        
        // Guardar la base de datos
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        
        console.log('✅ ¡Balance agregado exitosamente!');
        console.log('📊 Nuevo balance:');
        console.log('  - Usuario ID:', userId);
        console.log('  - Email:', user.email);
        console.log('  - Disponible: $' + user.balance_available);
        console.log('  - Bloqueado: $' + user.balance_locked);
        console.log('  - Total: $' + (user.balance_available + user.balance_locked));
        console.log('💳 Transacción creada:', transactionId);
        
    } catch (error) {
        console.error('🚨 Error:', error);
    }
}

// Ejecutar el script
console.log('🚀 Iniciando script de recarga de balance...');
addBalanceDirectly();
