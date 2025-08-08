// api/auth/google.js - Google OAuth con IDs consistentes
import { OAuth2Client } from 'google-auth-library';
import { getDatabase } from '../lib/database.js';

export default async function handler(req, res) {
    console.log('📡 Google auth API called:', req.method);

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
        // Obtener instancia de la base de datos
        const db = getDatabase();
        
        const { token, googleIdToken } = req.body;
        console.log('🔑 Login attempt with:', { token: !!token, googleIdToken: !!googleIdToken });

        // MODO DESARROLLO
        if (token === 'dev-token') {
            console.log('✅ Dev login successful');
            
            const userId = 'dev-user-123';
            let user = await db.getUserById(userId);
            
            if (!user) {
                user = await db.createUser({
                    id: userId,
                    email: 'test@example.com',
                    name: 'Test Player',
                    avatar: 'https://via.placeholder.com/64',
                    google_id: null
                });
                console.log('🆕 Created new dev user');
            } else {
                await db.updateUser(userId, { last_login: new Date().toISOString() });
                console.log('🔄 Updated existing dev user');
            }

            return res.json({
                success: true,
                token: 'dev-jwt-token-' + Date.now(),
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    avatar: user.avatar,
                    balance_available: user.balance_available,
                    balance_locked: user.balance_locked
                }
            });
        }

        // MODO PRODUCCIÓN - Google OAuth real
        if (googleIdToken) {
            console.log('🔐 Processing Google ID token...');

            // Validar con Google
            const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
            
            try {
                const ticket = await client.verifyIdToken({
                    idToken: googleIdToken,
                    audience: process.env.GOOGLE_CLIENT_ID
                });

                const payload = ticket.getPayload();
                console.log('✅ Google token verified for:', payload.email);

                // CAMBIO IMPORTANTE: Usar solo el Google ID como user ID (sin timestamp)
                const userId = 'google-' + payload.sub;
                console.log('🔍 Using consistent user ID:', userId);
                
                let user = await db.getUserById(userId);

                if (!user) {
                    // Nuevo usuario - crear con balance inicial
                    user = await db.createUser({
                        id: userId,
                        google_id: payload.sub,
                        email: payload.email,
                        name: payload.name,
                        avatar: payload.picture
                    });
                    
                    console.log('🆕 New Google user created:', payload.email, 'ID:', userId);
                } else {
                    // Usuario existente - actualizar datos pero mantener balance
                    user = await db.updateUser(userId, {
                        name: payload.name,
                        avatar: payload.picture
                    });
                    
                    console.log('🔄 Existing Google user updated:', payload.email, 'Balance:', user.balance_available);
                }

                // CAMBIO IMPORTANTE: Token incluye el mismo user ID (sin timestamp extra)
                const jwtToken = 'google-jwt-' + Date.now() + '-' + userId;
                console.log('🎫 Generated token for user ID:', userId);

                return res.json({
                    success: true,
                    token: jwtToken,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        avatar: user.avatar,
                        balance_available: user.balance_available,
                        balance_locked: user.balance_locked,
                        total_wagered: user.total_wagered || 0,
                        total_won: user.total_won || 0,
                        games_played: user.games_played || 0
                    }
                });

            } catch (googleError) {
                console.error('❌ Google token verification failed:', googleError);
                return res.status(401).json({ 
                    success: false, 
                    error: 'Invalid Google token' 
                });
            }
        }

        // Token no reconocido
        res.status(401).json({ 
            success: false, 
            error: 'Valid token required (dev-token or googleIdToken)' 
        });

    } catch (error) {
        console.error('🚨 Auth error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Authentication failed',
            details: error.message 
        });
    }
}