// api/config/google.js - Proporcionar Client ID para el frontend
export default async function handler(req, res) {
    console.log('🔧 Google config API called');

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Debug: mostrar todas las variables de entorno que empiecen con GOOGLE
        const envVars = Object.keys(process.env).filter(key => key.startsWith('GOOGLE'));
        console.log('🔍 Google env vars found:', envVars);
        
        // Obtener Client ID de las variables de entorno
        const clientId = process.env.GOOGLE_CLIENT_ID;
        
        console.log('🔍 Environment debug:', {
            hasClientId: !!clientId,
            clientIdLength: clientId ? clientId.length : 0,
            nodeEnv: process.env.NODE_ENV,
            platform: process.platform
        });

        if (!clientId) {
            console.warn('⚠️ GOOGLE_CLIENT_ID not found in process.env');
            
            // Para desarrollo, usar el valor directo (TEMPORAL)
            const hardcodedClientId = "421367768275-jjk740oflbsa4km4sic9eid674fce1fm.apps.googleusercontent.com";
            console.log('🔧 Using hardcoded client ID for development');
            
            return res.json({
                clientId: hardcodedClientId,
                configured: true,
                debug: 'Using hardcoded value - env vars not loaded'
            });
        }

        console.log('✅ Providing Google Client ID from environment');
        
        res.json({
            clientId: clientId,
            configured: true,
            source: 'environment'
        });

    } catch (error) {
        console.error('🚨 Error getting Google config:', error);
        res.status(500).json({ 
            error: 'Failed to get Google configuration',
            clientId: null,
            details: error.message
        });
    }
}