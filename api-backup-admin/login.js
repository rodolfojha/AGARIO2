// api/admin/login.js - Login directo para administradores
import { getDatabase } from '../lib/database.js';

export default async function handler(req, res) {
    console.log('👑 Admin login API called:', req.method);

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const db = getDatabase();
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email y contraseña son requeridos' 
            });
        }

        // Buscar usuario por email
        const user = await db.getUserByEmail(email);
        
        if (!user) {
            console.log('❌ Admin login failed: User not found:', email);
            return res.status(401).json({ 
                error: 'Credenciales inválidas' 
            });
        }

        // Verificar si es administrador
        if (!user.is_admin) {
            console.log('❌ Admin login failed: User is not admin:', email);
            return res.status(403).json({ 
                error: 'No tienes permisos de administrador' 
            });
        }

        // Para simplificar, usamos una contraseña hardcodeada
        // En producción, deberías usar hash y salt
        const adminPassword = 'admin123'; // Contraseña temporal
        
        if (password !== adminPassword) {
            console.log('❌ Admin login failed: Wrong password for:', email);
            return res.status(401).json({ 
                error: 'Credenciales inválidas' 
            });
        }

        // Generar token de administrador
        const adminToken = 'admin-jwt-' + Date.now() + '-' + user.id;
        
        // Actualizar último login
        await db.updateUser(user.id, { last_login: new Date().toISOString() });

        console.log('✅ Admin login successful:', email);
        
        return res.json({
            success: true,
            message: 'Login exitoso',
            token: adminToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                is_admin: user.is_admin
            }
        });

    } catch (error) {
        console.error('🚨 Admin login error:', error);
        res.status(500).json({ 
            error: 'Error en el login',
            details: error.message 
        });
    }
}
