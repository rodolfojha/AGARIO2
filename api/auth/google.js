// api/auth/google.js - Formato correcto para Vercel
export default async function handler(req, res) {
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
        const { token } = req.body;

        // Para desarrollo - bypass Google auth
        if (token === 'dev-token') {
            console.log('🔑 Dev login successful');
            
            // Usuario de prueba
            const testUser = {
                id: 'dev-user-123',
                email: 'test@example.com',
                name: 'Test Player',
                balance_available: 100.00,
                balance_locked: 0.00
            };

            // JWT token simple
            const jwtToken = 'dev-jwt-token-' + Date.now();
            
            return res.json({
                success: true,
                token: jwtToken,
                user: testUser
            });
        }

        res.status(401).json({ 
            success: false, 
            error: 'Use dev-token for development' 
        });

    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Authentication failed' 
        });
    }
}