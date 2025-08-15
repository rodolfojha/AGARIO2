export default function handler(req, res) {
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
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email y contraseña son requeridos' 
            });
        }

        // Verificación simple para prueba
        if (email === 'rodolfoalva1345@gmail.com' && password === 'admin123') {
            return res.json({
                success: true,
                message: 'Login exitoso (test)',
                token: 'test-admin-token-' + Date.now(),
                user: {
                    id: 'test-admin-123',
                    email: email,
                    name: 'Rodolfo Alvarez (Test)',
                    is_admin: true
                }
            });
        } else {
            return res.status(401).json({ 
                error: 'Credenciales inválidas' 
            });
        }

    } catch (error) {
        res.status(500).json({ 
            error: 'Error en el login',
            details: error.message 
        });
    }
}
