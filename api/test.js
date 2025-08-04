export default function handler(req, res) {
    console.log('🔥 Test API called');
    res.json({ message: 'API funcionando!', method: req.method });
}