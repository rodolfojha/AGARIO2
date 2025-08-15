// api/admin/test.js - Endpoint de prueba para APIs de administración
export default async function handler(req, res) {
    console.log('🧪 Admin test API called:', req.method);

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    return res.json({
        success: true,
        message: 'Admin API endpoints are working!',
        timestamp: new Date().toISOString(),
        method: req.method,
        headers: {
            authorization: req.headers.authorization ? 'Present' : 'Missing',
            'content-type': req.headers['content-type'] || 'Not set'
        }
    });
}
