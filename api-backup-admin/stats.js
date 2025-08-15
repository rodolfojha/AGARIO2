// api/admin/stats.js - Estadísticas del servidor para administradores
import { getDatabase } from '../lib/database.js';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
    console.log('📊 Admin stats API called:', req.method);

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
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

        // Verificar si el usuario es administrador
        const user = await db.getUserById(userId);
        if (!user || !user.is_admin) {
            console.log('❌ Non-admin user attempted to access stats:', user?.email);
            return res.status(403).json({ error: 'Admin access required' });
        }

        console.log('👑 Admin user accessing stats:', user.email);

        // Obtener datos de la base de datos
        const data = db.loadData();
        
        // Calcular estadísticas
        const totalUsers = Object.keys(data.users).length;
        const totalGames = Object.keys(data.games).length;
        const totalTransactions = Object.keys(data.transactions).length;
        
        // Usuarios activos (últimos 24 horas)
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const activeUsers = Object.values(data.users).filter(user => {
            const lastLogin = new Date(user.last_login);
            return lastLogin > oneDayAgo;
        }).length;

        // Juegos activos (últimos 30 minutos)
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
        const activeGames = Object.values(data.games).filter(game => {
            const gameTime = new Date(game.created_at);
            return gameTime > thirtyMinutesAgo && !game.completed;
        }).length;

        // Estadísticas de balance
        const totalBalance = Object.values(data.users).reduce((sum, user) => {
            return sum + (user.balance_available || 0) + (user.balance_locked || 0);
        }, 0);

        const totalWagered = Object.values(data.users).reduce((sum, user) => {
            return sum + (user.total_wagered || 0);
        }, 0);

        const totalWon = Object.values(data.users).reduce((sum, user) => {
            return sum + (user.total_won || 0);
        }, 0);

        // Información del sistema
        const systemInfo = {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            nodeVersion: process.version,
            platform: process.platform
        };

        // Estadísticas de archivos
        const dbFile = path.join(process.cwd(), 'tmp', 'database.json');
        const dbFileSize = fs.existsSync(dbFile) ? fs.statSync(dbFile).size : 0;

        const stats = {
            users: {
                total: totalUsers,
                active: activeUsers,
                admins: Object.values(data.users).filter(u => u.is_admin).length
            },
            games: {
                total: totalGames,
                active: activeGames
            },
            transactions: {
                total: totalTransactions
            },
            balance: {
                total: totalBalance.toFixed(2),
                totalWagered: totalWagered.toFixed(2),
                totalWon: totalWon.toFixed(2),
                profit: (totalWagered - totalWon).toFixed(2)
            },
            system: {
                uptime: Math.floor(systemInfo.uptime / 60), // minutos
                memory: {
                    used: Math.round(systemInfo.memory.heapUsed / 1024 / 1024), // MB
                    total: Math.round(systemInfo.memory.heapTotal / 1024 / 1024) // MB
                },
                nodeVersion: systemInfo.nodeVersion,
                platform: systemInfo.platform,
                dbFileSize: Math.round(dbFileSize / 1024) // KB
            },
            lastUpdate: new Date().toISOString()
        };

        console.log('📊 Stats generated for admin:', user.email);
        
        return res.json({
            success: true,
            stats: stats
        });

    } catch (error) {
        console.error('🚨 Admin stats error:', error);
        res.status(500).json({ 
            error: 'Stats generation failed',
            details: error.message 
        });
    }
}
