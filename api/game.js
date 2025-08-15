module.exports = (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extraer el endpoint de la URL
  const url = req.url;
  const endpoint = url.split('/').pop() || 'default';

  console.log('🎮 Game API called:', { method: req.method, url, endpoint });

  try {
    switch (endpoint) {
      case 'start':
        return handleGameStart(req, res);
      default:
        return res.status(404).json({ error: 'Endpoint not found', available: ['start'] });
    }
  } catch (error) {
    console.error('🚨 Game API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Iniciar juego
function handleGameStart(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { betAmount } = req.body;

  if (!betAmount || betAmount <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount' });
  }

  // Verificar token (simplificado para testing)
  if (!token.startsWith('admin-jwt-') && !token.startsWith('google-jwt-') && !token.startsWith('dev-jwt-')) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Generar datos del juego
  const gameId = 'game-' + Date.now();
  const gameData = {
    gameId: gameId,
    betAmount: parseFloat(betAmount),
    startTime: new Date().toISOString(),
    status: 'active',
    roomConfig: {
      width: 2000,
      height: 2000,
      maxPlayers: 25,
      foodCount: 200,
      virusCount: 10
    },
    player: {
      id: 'player-' + Date.now(),
      name: 'Player',
      balance: 1000.00,
      position: {
        x: Math.random() * 2000,
        y: Math.random() * 2000
      }
    },
    server: {
      host: 'game.splittaio.com',
      port: 443,
      secure: true
    }
  };

  console.log('🎮 Game started:', { gameId, betAmount });

  return res.json({
    success: true,
    message: 'Game started successfully',
    gameData: gameData
  });
}
