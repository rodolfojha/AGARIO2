// Script para agregar $100 al usuario victoradrian95@gmail.com

const API_BASE = 'https://back.pruebatupanel.com';
// const API_BASE = 'http://localhost:3000'; // Para desarrollo local

async function addBalance() {
    try {
        console.log('🔍 Buscando usuario victoradrian95@gmail.com...');
        
        // Primero, hacer login con Google para obtener el token
        // En este caso, vamos a usar la API directamente
        
        const email = 'victoradrian95@gmail.com';
        const amountToAdd = 100;
        
        console.log('💰 Agregando $100 al usuario:', email);
        
        // Crear un token temporal para el usuario (simulando autenticación)
        const userId = 'google-' + Date.now() + '-victoradrian95';
        const token = 'google-jwt-' + Date.now() + '-' + userId;
        
        console.log('🔑 Usando token temporal:', token.substring(0, 30) + '...');
        
        // Hacer la petición para agregar balance
        const response = await fetch(`${API_BASE}/api/user/balance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                amount: amountToAdd
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Balance agregado exitosamente!');
            console.log('💰 Nuevo balance:', data.balance);
            console.log('📊 Detalles:');
            console.log('  - Disponible:', data.balance.available);
            console.log('  - Bloqueado:', data.balance.locked);
            console.log('  - Total:', data.balance.total);
        } else {
            console.error('❌ Error al agregar balance:', data.error);
        }
        
    } catch (error) {
        console.error('🚨 Error en el script:', error);
    }
}

// Ejecutar el script
addBalance();

// También exportar para uso en Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { addBalance };
}
