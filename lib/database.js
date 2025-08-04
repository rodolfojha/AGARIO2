// lib/database.js - Sistema de base de datos
const { Pool } = require('pg');

class Database {
    constructor() {
        // Para desarrollo local (SQLite-like en memoria)
        this.isDev = process.env.NODE_ENV !== 'production';
        
        if (this.isDev) {
            // Mock database para desarrollo
            this.users = new Map();
            this.games = new Map();
            this.transactions = new Map();
            console.log('🔧 Using in-memory database for development');
        } else {
            // PostgreSQL para producción en Vercel
            this.pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: { rejectUnauthorized: false }
            });
        }
    }

    // === USUARIOS ===
    async createUser(userData) {
        const user = {
            id: Date.now().toString(),
            email: userData.email,
            google_id: userData.google_id,
            name: userData.name,
            balance_available: 0,
            balance_locked: 0,
            created_at: new Date().toISOString(),
            ...userData
        };

        if (this.isDev) {
            this.users.set(user.id, user);
            return user;
        } else {
            const query = `
                INSERT INTO users (email, google_id, name, balance_available, balance_locked)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;
            const result = await this.pool.query(query, [
                user.email, user.google_id, user.name, user.balance_available, user.balance_locked
            ]);
            return result.rows[0];
        }
    }

    async getUserByEmail(email) {
        if (this.isDev) {
            return Array.from(this.users.values()).find(u => u.email === email);
        } else {
            const result = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
            return result.rows[0];
        }
    }

    async getUserById(id) {
        if (this.isDev) {
            return this.users.get(id);
        } else {
            const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
            return result.rows[0];
        }
    }

    async updateUserBalance(userId, availableBalance, lockedBalance) {
        if (this.isDev) {
            const user = this.users.get(userId);
            if (user) {
                user.balance_available = availableBalance;
                user.balance_locked = lockedBalance;
                this.users.set(userId, user);
                return user;
            }
        } else {
            const query = `
                UPDATE users 
                SET balance_available = $1, balance_locked = $2 
                WHERE id = $3 
                RETURNING *
            `;
            const result = await this.pool.query(query, [availableBalance, lockedBalance, userId]);
            return result.rows[0];
        }
    }

    // === JUEGOS ===
    async createGame(userId, betAmount) {
        const game = {
            id: Date.now().toString(),
            player_id: userId,
            bet_amount: betAmount,
            current_value: betAmount,
            status: 'active',
            started_at: new Date().toISOString(),
            ended_at: null
        };

        if (this.isDev) {
            this.games.set(game.id, game);
            return game;
        } else {
            const query = `
                INSERT INTO games (player_id, bet_amount, current_value, status)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const result = await this.pool.query(query, [userId, betAmount, betAmount, 'active']);
            return result.rows[0];
        }
    }

    async updateGameValue(gameId, currentValue) {
        if (this.isDev) {
            const game = this.games.get(gameId);
            if (game) {
                game.current_value = currentValue;
                this.games.set(gameId, game);
                return game;
            }
        } else {
            const query = `
                UPDATE games 
                SET current_value = $1 
                WHERE id = $2 
                RETURNING *
            `;
            const result = await this.pool.query(query, [currentValue, gameId]);
            return result.rows[0];
        }
    }

    async endGame(gameId, status, finalValue) {
        if (this.isDev) {
            const game = this.games.get(gameId);
            if (game) {
                game.status = status;
                game.current_value = finalValue;
                game.ended_at = new Date().toISOString();
                this.games.set(gameId, game);
                return game;
            }
        } else {
            const query = `
                UPDATE games 
                SET status = $1, current_value = $2, ended_at = NOW() 
                WHERE id = $3 
                RETURNING *
            `;
            const result = await this.pool.query(query, [status, finalValue, gameId]);
            return result.rows[0];
        }
    }

    // === TRANSACCIONES ===
    async createTransaction(userId, type, amount, metadata = {}) {
        const transaction = {
            id: Date.now().toString(),
            user_id: userId,
            type, // 'bet', 'cashout', 'fee', 'deposit', 'withdrawal'
            amount,
            status: 'completed',
            metadata: JSON.stringify(metadata),
            created_at: new Date().toISOString()
        };

        if (this.isDev) {
            this.transactions.set(transaction.id, transaction);
            return transaction;
        } else {
            const query = `
                INSERT INTO transactions (user_id, type, amount, status, metadata)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;
            const result = await this.pool.query(query, [
                userId, type, amount, 'completed', JSON.stringify(metadata)
            ]);
            return result.rows[0];
        }
    }

    // === INICIALIZACIÓN ===
    async initialize() {
        if (!this.isDev) {
            // Crear tablas en PostgreSQL si no existen
            await this.createTables();
        }
        
        // Crear usuario de prueba para desarrollo
        if (this.isDev) {
            await this.createTestUser();
        }
    }

    async createTestUser() {
        const testUser = {
            email: 'test@example.com',
            google_id: 'test123',
            name: 'Test Player',
            balance_available: 100 // $100 para pruebas
        };
        
        const exists = await this.getUserByEmail(testUser.email);
        if (!exists) {
            await this.createUser(testUser);
            console.log('✅ Test user created with $100 balance');
        }
    }

    async createTables() {
        const queries = [
            `CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                google_id VARCHAR(255) UNIQUE,
                name VARCHAR(255),
                balance_available DECIMAL(10,2) DEFAULT 0,
                balance_locked DECIMAL(10,2) DEFAULT 0,
                total_deposited DECIMAL(10,2) DEFAULT 0,
                total_withdrawn DECIMAL(10,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS games (
                id SERIAL PRIMARY KEY,
                player_id INTEGER REFERENCES users(id),
                bet_amount DECIMAL(10,2) NOT NULL,
                current_value DECIMAL(10,2) NOT NULL,
                status VARCHAR(20) DEFAULT 'active',
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ended_at TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                type VARCHAR(20) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                metadata TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (const query of queries) {
            await this.pool.query(query);
        }
        console.log('✅ Database tables created');
    }
}

// Singleton instance
const db = new Database();

module.exports = db;