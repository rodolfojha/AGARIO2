// api/lib/database.js - Base de datos basada en archivos (compartida entre APIs)
import fs from 'fs';
import path from 'path';

// Ruta del archivo de la base de datos
const DB_DIR = path.join(process.cwd(), 'tmp');
const DB_FILE = path.join(DB_DIR, 'database.json');

class Database {
    constructor() {
        this.ensureDbFile();
        console.log('🔗 Connected to file-based database');
    }

    // === SISTEMA DE ARCHIVOS ===
    ensureDbFile() {
        try {
            // Crear directorio tmp si no existe
            if (!fs.existsSync(DB_DIR)) {
                fs.mkdirSync(DB_DIR, { recursive: true });
                console.log('📁 Created tmp directory');
            }

            // Crear archivo de BD si no existe
            if (!fs.existsSync(DB_FILE)) {
                const initialData = {
                    users: {
                        'dev-user-123': {
                            id: 'dev-user-123',
                            email: 'test@example.com',
                            google_id: null,
                            name: 'Test Player',
                            avatar: 'https://via.placeholder.com/64',
                            balance_available: 100.00,
                            balance_locked: 0,
                            total_wagered: 0,
                            total_won: 0,
                            games_played: 0,
                            created_at: new Date().toISOString(),
                            last_login: new Date().toISOString()
                        }
                    },
                    games: {},
                    transactions: {},
                    lastUpdate: new Date().toISOString()
                };
                
                this.saveData(initialData);
                console.log('🗄️ Created new database file with test user');
            }
        } catch (error) {
            console.error('❌ Error ensuring DB file:', error);
        }
    }

    loadData() {
        try {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            const parsed = JSON.parse(data);
            console.log('📖 Database loaded:', {
                users: Object.keys(parsed.users).length,
                games: Object.keys(parsed.games).length,
                transactions: Object.keys(parsed.transactions).length
            });
            return parsed;
        } catch (error) {
            console.error('❌ Error loading database:', error);
            return { users: {}, games: {}, transactions: {} };
        }
    }

    saveData(data) {
        try {
            data.lastUpdate = new Date().toISOString();
            fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('❌ Error saving database:', error);
            return false;
        }
    }

    // === USUARIOS ===
    async createUser(userData) {
        const data = this.loadData();
        
        const user = {
            id: userData.id || `user-${Date.now()}`,
            email: userData.email,
            google_id: userData.google_id || null,
            name: userData.name,
            avatar: userData.avatar || null,
            balance_available: userData.balance_available !== undefined ? userData.balance_available : 100.00,
            balance_locked: userData.balance_locked || 0,
            total_wagered: userData.total_wagered || 0,
            total_won: userData.total_won || 0,
            games_played: userData.games_played || 0,
            created_at: userData.created_at || new Date().toISOString(),
            last_login: new Date().toISOString(),
            ...userData
        };

        data.users[user.id] = user;
        this.saveData(data);
        
        console.log('👤 User created:', user.email, 'ID:', user.id, 'Balance:', user.balance_available);
        return user;
    }

    async getUserByEmail(email) {
        const data = this.loadData();
        const user = Object.values(data.users).find(u => u.email === email);
        if (user) {
            console.log('👤 User found by email:', email, 'Balance:', user.balance_available);
        }
        return user;
    }

    async getUserById(id) {
        const data = this.loadData();
        const user = data.users[id];
        if (user) {
            console.log('👤 User found by ID:', id, 'Email:', user.email, 'Balance:', user.balance_available);
        } else {
            console.log('❌ User NOT found by ID:', id);
            console.log('🔍 Available users:', Object.keys(data.users));
        }
        return user;
    }

    async getUserByGoogleId(googleId) {
        const data = this.loadData();
        const user = Object.values(data.users).find(u => u.google_id === googleId);
        if (user) {
            console.log('👤 User found by Google ID:', googleId, 'Email:', user.email);
        }
        return user;
    }

    async updateUser(userId, updateData) {
        const data = this.loadData();
        const user = data.users[userId];
        if (user) {
            const updatedUser = { 
                ...user, 
                ...updateData, 
                last_login: new Date().toISOString() 
            };
            data.users[userId] = updatedUser;
            this.saveData(data);
            console.log('👤 User updated:', updatedUser.email, 'Balance:', updatedUser.balance_available);
            return updatedUser;
        }
        console.log('❌ User not found for update:', userId);
        return null;
    }

    async updateUserBalance(userId, availableBalance, lockedBalance) {
        const data = this.loadData();
        const user = data.users[userId];
        if (user) {
            user.balance_available = Math.max(0, availableBalance);
            user.balance_locked = Math.max(0, lockedBalance);
            user.last_login = new Date().toISOString();
            data.users[userId] = user;
            this.saveData(data);
            console.log('💰 Balance updated:', user.email, 'Available:', user.balance_available, 'Locked:', user.balance_locked);
            return user;
        }
        console.log('❌ User not found for balance update:', userId);
        return null;
    }

    // === JUEGOS ===
    async createGame(userId, betAmount) {
        const data = this.loadData();
        
        const game = {
            id: `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            player_id: userId,
            bet_amount: betAmount,
            current_value: betAmount,
            status: 'active',
            started_at: new Date().toISOString(),
            ended_at: null
        };

        data.games[game.id] = game;
        this.saveData(data);
        console.log('🎮 Game created:', game.id, 'Player:', userId, 'Bet:', betAmount);
        return game;
    }

    async getGame(gameId) {
        const data = this.loadData();
        const game = data.games[gameId];
        if (game) {
            console.log('🎮 Game found:', gameId, 'Status:', game.status);
        }
        return game;
    }

    async updateGameValue(gameId, currentValue) {
        const data = this.loadData();
        const game = data.games[gameId];
        if (game) {
            game.current_value = currentValue;
            data.games[gameId] = game;
            this.saveData(data);
            console.log('🎮 Game value updated:', gameId, 'New value:', currentValue);
            return game;
        }
        return null;
    }

    async endGame(gameId, status, finalValue) {
        const data = this.loadData();
        const game = data.games[gameId];
        if (game) {
            game.status = status;
            game.current_value = finalValue;
            game.ended_at = new Date().toISOString();
            data.games[gameId] = game;
            this.saveData(data);
            console.log('🏁 Game ended:', gameId, 'Status:', status, 'Final value:', finalValue);
            return game;
        }
        return null;
    }

    // === TRANSACCIONES ===
    async createTransaction(userId, type, amount, metadata = {}) {
        const data = this.loadData();
        
        const transaction = {
            id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            user_id: userId,
            type,
            amount,
            status: 'completed',
            metadata: JSON.stringify(metadata),
            created_at: new Date().toISOString()
        };

        data.transactions[transaction.id] = transaction;
        this.saveData(data);
        console.log('💳 Transaction created:', type, amount, 'for user:', userId);
        return transaction;
    }

    // === ESTADÍSTICAS ===
    async updateUserStats(userId, gameResult) {
        const data = this.loadData();
        const user = data.users[userId];
        if (user) {
            user.games_played = (user.games_played || 0) + 1;
            user.total_wagered = (user.total_wagered || 0) + gameResult.bet_amount;
            if (gameResult.won) {
                user.total_won = (user.total_won || 0) + gameResult.winnings;
            }
            data.users[userId] = user;
            this.saveData(data);
            console.log('📊 User stats updated:', user.email, 'Games:', user.games_played);
            return user;
        }
        return null;
    }

    // === UTILIDADES ===
    extractUserIdFromToken(token) {
    if (token.startsWith('dev-jwt-token-')) {
        return 'dev-user-123';
    } else if (token.startsWith('google-jwt-')) {
        // Formato: google-jwt-TIMESTAMP-google-GOOGLEID
        const tokenParts = token.split('-');
        console.log('🔍 Token parts:', tokenParts);
        
        if (tokenParts.length >= 5) {
            // Buscar la segunda ocurrencia de 'google' (la que está antes del ID)
            const firstGoogleIndex = tokenParts.findIndex(part => part === 'google');
            const secondGoogleIndex = tokenParts.findIndex((part, index) => part === 'google' && index > firstGoogleIndex);
            
            if (secondGoogleIndex !== -1 && tokenParts.length > secondGoogleIndex + 1) {
                // Tomar el elemento después de la segunda 'google' y agregar el prefijo
                const googleId = tokenParts[secondGoogleIndex + 1];
                const userId = `google-${googleId}`;
                console.log('🎯 Extracted user ID:', userId);
                return userId;
            }
        }
        
        console.log('❌ Failed to extract user ID from token:', token);
    }
    return null;
}

    // === DEBUG  ===
    getAllUsers() {
        const data = this.loadData();
        return Object.values(data.users);
    }

    getAllGames() {
        const data = this.loadData();
        return Object.values(data.games);
    }

    getStats() {
        const data = this.loadData();
        return {
            users: Object.keys(data.users).length,
            games: Object.keys(data.games).length,
            transactions: Object.keys(data.transactions).length,
            lastUpdate: data.lastUpdate
        };
    }

    debugUser(userId) {
        const data = this.loadData();
        const user = data.users[userId];
        console.log('🔍 Debug user:', userId);
        console.log('🔍 User exists:', !!user);
        if (user) {
            console.log('🔍 User data:', {
                id: user.id,
                email: user.email,
                balance_available: user.balance_available,
                balance_locked: user.balance_locked
            });
        }
        console.log('🔍 All users:', Object.keys(data.users));
    }
}

// Singleton
let dbInstance = null;

export function getDatabase() {
    if (!dbInstance) {
        dbInstance = new Database();
    }
    return dbInstance;
}

export default getDatabase;