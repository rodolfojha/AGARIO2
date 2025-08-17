#!/usr/bin/env node

// test_balance.js - Script simple para probar balance
// Uso: node test_balance.js

const { addBalanceDirectly } = require('./add_balance_dev.js');

console.log('🧪 Probando funcionalidad de balance...\n');

// Probar diferentes montos
const testAmounts = [50, 100, 200, 500];

async function runTests() {
    for (const amount of testAmounts) {
        console.log(`\n--- Probando recarga de $${amount} ---`);
        const success = addBalanceDirectly(amount);
        
        if (success) {
            console.log(`✅ Recarga de $${amount} exitosa`);
        } else {
            console.log(`❌ Recarga de $${amount} falló`);
        }
        
        // Pausa entre pruebas
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎉 Pruebas completadas!');
}

runTests().catch(console.error);
