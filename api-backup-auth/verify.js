// api/auth/verify.js - Verificar usuarios con BD unificada
import { getDatabase } from '../lib/database.js';

export default async function handler(req, res) {
    console.log('🔍 Verify API called:', req.method);

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const db = getDatabase();
        
        const authHeader = req.headers.authorization;
        console.log('🔍 Auth header received:', !!authHeader);
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.replace('Bearer ', '');
        
        // Extraer user ID del token usando la utilidad de la BD
        const userId = db.extractUserIdFromToken(token);
        
        if (!userId) {
            console.log('❌ Invalid token format');
            return res.status(401).json({ error: 'Invalid token' });
        }

        console.log('🔍 Looking for user:', userId);

        // Obtener usuario de la base de datos
        const user = await db.getUserById(userId);
        
        if (!user) {
            console.log('❌ User not found in database');
            return res.status(401).json({ error: 'User not found' });
        }

        // Actualizar última conexión
        await db.updateUser(userId, { last_login: new Date().toISOString() });

        console.log('✅ User verified:', {
            email: user.email,
            balance_available: user.balance_available,
            balance_locked: user.balance_locked,
            games_played: user.games_played
        });
        
        return res.json({
            valid: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                balance_available: user.balance_available,
                balance_locked: user.balance_locked,
                total_wagered: user.total_wagered || 0,
                total_won: user.total_won || 0,
                games_played: user.games_played || 0,
                created_at: user.created_at,
                last_login: user.last_login
            }
        });

    } catch (error) {
        console.error('🚨 Verify error:', error);
        res.status(500).json({ 
            error: 'Verification failed',
            details: error.message 
        });
    }
}