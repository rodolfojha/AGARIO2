// api/admin/setup-first-admin.js - Configurar el primer administrador del sistema
import { getDatabase } from '../lib/database.js';

export default async function handler(req, res) {
    console.log('👑 Setup first admin API called:', req.method);

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const db = getDatabase();
        
        // Verificar si ya existe un administrador
        const data = db.loadData();
        const existingAdmins = Object.values(data.users).filter(user => user.is_admin);
        
        if (existingAdmins.length > 0) {
            console.log('❌ Admin setup attempted but admins already exist');
            return res.status(403).json({ 
                error: 'Administrators already exist. Use the assign-admin endpoint instead.' 
            });
        }

        const { email, name, googleId } = req.body;
        
        if (!email || !name) {
            return res.status(400).json({ 
                error: 'Missing required fields: email and name' 
            });
        }

        // Verificar si el usuario ya existe
        let user = await db.getUserByEmail(email);
        
        if (!user) {
            // Crear nuevo usuario administrador
            const userId = googleId ? `google-${googleId}` : `admin-${Date.now()}`;
            
            user = await db.createUser({
                id: userId,
                email: email,
                name: name,
                google_id: googleId || null,
                is_admin: true,
                balance_available: 1000.00, // Balance inicial para administradores
                balance_locked: 0
            });
            
            console.log('👑 First admin created:', email, 'ID:', userId);
        } else {
            // Actualizar usuario existente como administrador
            user = await db.updateUser(user.id, { 
                is_admin: true,
                name: name
            });
            
            console.log('👑 Existing user promoted to first admin:', email);
        }

        return res.json({
            success: true,
            message: `First administrator created successfully: ${email}`,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                is_admin: user.is_admin
            }
        });

    } catch (error) {
        console.error('🚨 Setup first admin error:', error);
        res.status(500).json({ 
            error: 'First admin setup failed',
            details: error.message 
        });
    }
}
