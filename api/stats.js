module.exports = (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Stats simuladas
  return res.json({
    success: true,
    stats: {
      users: {
        total: 10,
        active: 3,
        admins: 1
      },
      games: {
        total: 25,
        active: 2
      },
      balance: {
        total: '1000.00',
        totalWagered: '500.00',
        totalWon: '450.00',
        profit: '50.00'
      },
      system: {
        uptime: 120,
        memory: {
          used: 45,
          total: 100
        },
        nodeVersion: 'v18.0.0',
        platform: 'linux',
        dbFileSize: 25
      }
    }
  });
};
