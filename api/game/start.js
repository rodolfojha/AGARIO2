// api/game/start.js - Iniciar juego con BD unificada
import { getDatabase } from '../lib/database.js';

export default async function handler(req, res) {
    console.log('🎮 Start game API called');
    
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

        const { betAmount } = req.body;
        console.log('🎯 Game request:', { userId, betAmount });

        // Validar monto
        if (!betAmount || betAmount < 1 || betAmount > 5) {
            return res.status(400).json({ 
                error: 'Bet amount must be between $1 and $5' 
            });
        }

        // Obtener usuario
        let user = await db.getUserById(userId);
        if (!user) {
            console.log('❌ User not found in database');
            return res.status(401).json({ error: 'User not found' });
        }

        console.log('👤 User found:', {
            id: user.id,
            balance_available: user.balance_available,
            balance_locked: user.balance_locked
        });

        // Verificar balance suficiente
        if (user.balance_available < betAmount) {
            return res.status(400).json({ 
                error: 'Insufficient balance',
                required: betAmount,
                available: user.balance_available
            });
        }

        // Crear juego
        const game = await db.createGame(userId, betAmount);

        // Actualizar balance del usuario (bloquear fondos)
        const newAvailable = user.balance_available - betAmount;
        const newLocked = user.balance_locked + betAmount;
        
        const updatedUser = await db.updateUserBalance(userId, newAvailable, newLocked);

        // Crear transacción
        await db.createTransaction(userId, 'bet', betAmount, {
            gameId: game.id,
            timestamp: new Date().toISOString()
        });

        console.log('✅ Game started successfully:', { 
            userId, 
            gameId: game.id, 
            betAmount,
            newAvailableBalance: updatedUser.balance_available,
            newLockedBalance: updatedUser.balance_locked
        });

        res.json({
            success: true,
            game: {
                id: game.id,
                bet_amount: betAmount,
                current_value: betAmount
            },
            balance: {
                available: updatedUser.balance_available,
                locked: updatedUser.balance_locked
            }
        });

    } catch (error) {
        console.error('🚨 Start game error:', error);
        res.status(500).json({ 
            error: 'Failed to start game',
            details: error.message 
        });
    }
}