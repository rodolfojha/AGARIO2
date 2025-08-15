// api/admin/assign-admin.js - Asignar permisos de administrador
import { getDatabase } from '../lib/database.js';

export default async function handler(req, res) {
    console.log('👑 Assign admin API called:', req.method);

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
        
        // Verificar autenticación y permisos de administrador
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.replace('Bearer ', '');
        const userId = db.extractUserIdFromToken(token);
        
        if (!userId) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Verificar si el usuario actual es administrador
        const currentUser = await db.getUserById(userId);
        if (!currentUser || !currentUser.is_admin) {
            console.log('❌ Non-admin user attempted to assign admin:', currentUser?.email);
            return res.status(403).json({ error: 'Admin access required' });
        }

        console.log('👑 Admin user assigning admin privileges:', currentUser.email);

        const { targetEmail, action } = req.body;
        
        if (!targetEmail || !action) {
            return res.status(400).json({ 
                error: 'Missing required fields: targetEmail and action' 
            });
        }

        if (!['grant', 'revoke'].includes(action)) {
            return res.status(400).json({ 
                error: 'Invalid action. Must be: grant or revoke' 
            });
        }

        // Buscar usuario objetivo por email
        const targetUser = await db.getUserByEmail(targetEmail);
        
        if (!targetUser) {
            return res.status(404).json({ 
                error: 'User not found with that email address' 
            });
        }

        // No permitir revocar permisos de administrador a sí mismo
        if (targetUser.id === currentUser.id && action === 'revoke') {
            return res.status(400).json({ 
                error: 'Cannot revoke admin privileges from yourself' 
            });
        }

        // Actualizar permisos de administrador
        const isAdmin = action === 'grant';
        const updatedUser = await db.updateUser(targetUser.id, { is_admin: isAdmin });

        if (updatedUser) {
            console.log(`👑 Admin privileges ${action === 'grant' ? 'granted to' : 'revoked from'}:`, targetUser.email);
            
            return res.json({
                success: true,
                message: `Admin privileges ${action === 'grant' ? 'granted to' : 'revoked from'} ${targetUser.email}`,
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    name: updatedUser.name,
                    is_admin: updatedUser.is_admin
                }
            });
        } else {
            return res.status(500).json({ error: 'Failed to update user permissions' });
        }

    } catch (error) {
        console.error('🚨 Assign admin error:', error);
        res.status(500).json({ 
            error: 'Admin assignment failed',
            details: error.message 
        });
    }
}
