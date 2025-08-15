// api/admin/check-status.js - Verificar si el usuario es administrador
import { getDatabase } from '../lib/database.js';

export default async function handler(req, res) {
    console.log('👑 Admin check status API called:', req.method);

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

        console.log('🔍 Looking for admin user:', userId);

        // Obtener usuario de la base de datos
        const user = await db.getUserById(userId);
        
        if (!user) {
            console.log('❌ User not found in database');
            return res.status(401).json({ error: 'User not found' });
        }

        const isAdmin = user.is_admin === true;
        
        console.log('👑 Admin check result:', {
            email: user.email,
            is_admin: isAdmin
        });
        
        return res.json({
            isAdmin: isAdmin,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                is_admin: isAdmin
            }
        });

    } catch (error) {
        console.error('🚨 Admin check error:', error);
        res.status(500).json({ 
            error: 'Admin check failed',
            details: error.message 
        });
    }
}
