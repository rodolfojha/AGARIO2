// api/admin/room-config.js - Configuración de salas del juego
import { getDatabase } from '../lib/database.js';
import fs from 'fs';
import path from 'path';

// Ruta del archivo de configuración de salas
const CONFIG_DIR = path.join(process.cwd(), 'tmp');
const ROOM_CONFIG_FILE = path.join(CONFIG_DIR, 'room-config.json');

// Configuraciones por defecto
const DEFAULT_ROOM_CONFIG = {
    currentRoom: 'medium',
    configs: {
        small: {
            name: 'Sala Pequeña',
            dimensions: '2000x2000',
            capacity: '20-30 jugadores',
            width: 2000,
            height: 2000,
            maxPlayers: 30,
            foodCount: 1000,
            virusCount: 50,
            description: 'Ideal para partidas rápidas y competitivas'
        },
        medium: {
            name: 'Sala Mediana',
            dimensions: '3000x3000',
            capacity: '50-80 jugadores',
            width: 3000,
            height: 3000,
            maxPlayers: 80,
            foodCount: 2000,
            virusCount: 100,
            description: 'Balance entre velocidad y espacio'
        },
        large: {
            name: 'Sala Grande',
            dimensions: '4000x4000',
            capacity: '100-150 jugadores',
            width: 4000,
            height: 4000,
            maxPlayers: 150,
            foodCount: 3500,
            virusCount: 200,
            description: 'Para partidas épicas con muchos jugadores'
        }
    }
};

// Función para cargar configuración
function loadRoomConfig() {
    try {
        if (!fs.existsSync(ROOM_CONFIG_FILE)) {
            // Crear directorio si no existe
            if (!fs.existsSync(CONFIG_DIR)) {
                fs.mkdirSync(CONFIG_DIR, { recursive: true });
            }
            
            // Crear archivo con configuración por defecto
            fs.writeFileSync(ROOM_CONFIG_FILE, JSON.stringify(DEFAULT_ROOM_CONFIG, null, 2));
            console.log('🏟️ Created default room configuration');
            return DEFAULT_ROOM_CONFIG;
        }
        
        const data = fs.readFileSync(ROOM_CONFIG_FILE, 'utf8');
        const config = JSON.parse(data);
        console.log('🏟️ Room config loaded:', config.currentRoom);
        return config;
    } catch (error) {
        console.error('❌ Error loading room config:', error);
        return DEFAULT_ROOM_CONFIG;
    }
}

// Función para guardar configuración
function saveRoomConfig(config) {
    try {
        if (!fs.existsSync(CONFIG_DIR)) {
            fs.mkdirSync(CONFIG_DIR, { recursive: true });
        }
        
        fs.writeFileSync(ROOM_CONFIG_FILE, JSON.stringify(config, null, 2));
        console.log('🏟️ Room config saved:', config.currentRoom);
        return true;
    } catch (error) {
        console.error('❌ Error saving room config:', error);
        return false;
    }
}

export default async function handler(req, res) {
    console.log('🏟️ Room config API called:', req.method);

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
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
            console.log('❌ Non-admin user attempted to access room config:', user?.email);
            return res.status(403).json({ error: 'Admin access required' });
        }

        console.log('👑 Admin user accessing room config:', user.email);

        if (req.method === 'GET') {
            // Obtener configuración actual
            const config = loadRoomConfig();
            
            return res.json({
                success: true,
                config: config
            });

        } else if (req.method === 'POST' || req.method === 'PUT') {
            // Actualizar configuración
            const { roomType } = req.body;
            
            if (!roomType || !['small', 'medium', 'large'].includes(roomType)) {
                return res.status(400).json({ 
                    error: 'Invalid room type. Must be: small, medium, or large' 
                });
            }

            const config = loadRoomConfig();
            config.currentRoom = roomType;
            
            if (saveRoomConfig(config)) {
                console.log('🏟️ Room config updated to:', roomType, 'by admin:', user.email);
                
                return res.json({
                    success: true,
                    message: `Sala configurada a: ${config.configs[roomType].name}`,
                    config: config
                });
            } else {
                return res.status(500).json({ error: 'Failed to save room configuration' });
            }
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('🚨 Room config error:', error);
        res.status(500).json({ 
            error: 'Room configuration failed',
            details: error.message 
        });
    }
}
