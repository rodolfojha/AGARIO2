export default function handler(req, res) {
    res.status(200).json({ 
        message: 'Hello from Vercel API!',
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString()
    });
}
