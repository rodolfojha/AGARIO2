// api/test-vercel.js - Test simple para verificar que Vercel funciona
export default function handler(req, res) {
    console.log('🧪 Test Vercel API called:', req.method);

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    return res.json({
        success: true,
        message: 'Vercel API is working!',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        headers: {
            'user-agent': req.headers['user-agent'] || 'Unknown',
            'host': req.headers.host || 'Unknown'
        }
    });
}
