const { authenticateUser } = require('../../lib/auth');
const db = require('../../lib/database');

module.exports = async (req, res) => {
    // Aplicar middleware
    await new Promise((resolve, reject) => {
        authenticateUser(req, res, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const user = await db.getUserById(req.userId);
        
        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                balance_available: parseFloat(user.balance_available),
                balance_locked: parseFloat(user.balance_locked),
                total_deposited: parseFloat(user.total_deposited || 0),
                total_withdrawn: parseFloat(user.total_withdrawn || 0),
                member_since: user.created_at
            }
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
};