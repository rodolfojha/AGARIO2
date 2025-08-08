// api/game/cashout.js - Cash out con BD unificada
import { getDatabase } from '../lib/database.js';

export default async function handler(req, res) {
    console.log('💰 Cash out API called');
    
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const db = getDatabase();
        
        // Verificar auth
        const authHeader = req.headers.authorization;
        console.log('🔍 Auth header received:', !!authHeader);
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No authorization header' });
        }

        const token = authHeader.replace('Bearer ', '');
        console.log('🔍 Token type:', token.substring(0, 10) + '...');

        // Extraer user ID del token
        const userId = db.extractUserIdFromToken(token);
        
        if (!userId) {
            console.log('❌ Unable to extract user ID from token');
            return res.status(401).json({ error: 'Invalid token format' });
        }

        const { gameId, currentValue } = req.body;
        console.log('💸 Processing cash out:', { userId, gameId, currentValue });

        if (!gameId || currentValue === undefined) {
            return res.status(400).json({ error: 'Missing gameId or currentValue' });
        }

        // Obtener usuario
        const user = await db.getUserById(userId);
        if (!user) {
            console.log('❌ User not found in database');
            return res.status(401).json({ error: 'User not found' });
        }

        // Obtener juego
        const game = await db.getGame(gameId);
        if (!game) {
            console.log('⚠️ Game not found:', gameId);
            // Continuar anyway - podría ser un juego del sistema anterior
        }

        // Calcular cash out (90% al usuario, 10% fee)
        const fee = currentValue * 0.1;
        const netAmount = currentValue * 0.9;
        const originalBet = game ? game.bet_amount : currentValue;

        console.log('💰 Cash out calculation:', {
            originalValue: currentValue,
            fee: fee,
            netAmount: netAmount,
            currentBalance: user.balance_available,
            originalBet: originalBet
        });

        // Actualizar balances
        // Liberar fondos bloqueados y agregar las ganancias
        const newAvailable = user.balance_available + netAmount;
        const newLocked = Math.max(0, user.balance_locked - originalBet);

        const updatedUser = await db.updateUserBalance(userId, newAvailable, newLocked);

        // Finalizar juego
        if (game) {
            await db.endGame(gameId, 'cashed_out', currentValue);
            console.log('✅ Game finalized:', gameId);
        }

        // Crear transacciones
        await db.createTransaction(userId, 'cashout', netAmount, {
            gameId: gameId,
            originalValue: currentValue,
            fee: fee,
            timestamp: new Date().toISOString()
        });

        await db.createTransaction(userId, 'fee', fee, {
            gameId: gameId,
            cashoutValue: currentValue,
            timestamp: new Date().toISOString()
        });

        // Actualizar estadísticas
        if (game) {
            await db.updateUserStats(userId, {
                bet_amount: originalBet,
                won: true,
                winnings: netAmount
            });
        }

        console.log('✅ Cash out processed successfully:', { 
            userId,
            gameId, 
            originalValue: currentValue, 
            netAmount, 
            fee,
            newAvailableBalance: updatedUser.balance_available,
            newLockedBalance: updatedUser.balance_locked
        });

        res.json({
            success: true,
            cashout: {
                original_value: currentValue,
                net_amount: netAmount,
                fee: fee,
                roi: game ? ((currentValue / originalBet - 1) * 100).toFixed(2) : '0.00'
            },
            balance: {
                available: updatedUser.balance_available,
                locked: updatedUser.balance_locked
            }
        });

    } catch (error) {
        console.error('🚨 Cash out error:', error);
        res.status(500).json({ 
            error: 'Failed to process cash out',
            details: error.message 
        });
    }
}