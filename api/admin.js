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

  console.log('🔍 Admin API called:', { method: req.method, url, endpoint });

  try {
    switch (endpoint) {
      case 'login':
        return handleLogin(req, res);
      case 'check-status':
        return handleCheckStatus(req, res);
      case 'stats':
        return handleStats(req, res);
      case 'room-config':
        return handleRoomConfig(req, res);
      case 'assign-admin':
        return handleAssignAdmin(req, res);
      case 'setup-first-admin':
        return handleSetupFirstAdmin(req, res);
      case 'test':
        return handleTest(req, res);
      default:
        return res.status(404).json({ error: 'Endpoint not found', available: ['login', 'check-status', 'stats', 'room-config', 'assign-admin', 'setup-first-admin', 'test'] });
    }
  } catch (error) {
    console.error('🚨 Admin API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Login de administrador
function handleLogin(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  // Login simple para testing
  if (email === 'rodolfoalva1345@gmail.com' && password === 'admin123') {
    return res.json({
      success: true,
      message: 'Login exitoso',
      token: 'admin-jwt-' + Date.now() + '-admin-123',
      user: {
        id: 'admin-123',
        email: email,
        name: 'Rodolfo Alvarez',
        is_admin: true
      }
    });
  }

  return res.status(401).json({ error: 'Credenciales inválidas' });
}

// Verificar estado de admin
function handleCheckStatus(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Verificar token de admin
  if (token.startsWith('admin-jwt-')) {
    return res.json({ 
      isAdmin: true, 
      user: { 
        id: 'admin-123', 
        email: 'rodolfoalva1345@gmail.com', 
        name: 'Rodolfo Alvarez', 
        is_admin: true 
      } 
    });
  }

  return res.status(401).json({ error: 'Invalid token' });
}

// Estadísticas del servidor
function handleStats(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.json({
    success: true,
    stats: {
      users: {
        total: 15,
        active: 5,
        admins: 1
      },
      games: {
        total: 45,
        active: 3
      },
      balance: {
        total: '2500.00',
        totalWagered: '1200.00',
        totalWon: '1100.00',
        profit: '100.00'
      },
      system: {
        uptime: 3600,
        memory: {
          used: 65,
          total: 100
        },
        nodeVersion: 'v22.0.0',
        platform: 'linux',
        dbFileSize: 45
      }
    }
  });
}

// Configuración de salas
function handleRoomConfig(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token.startsWith('admin-jwt-')) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Importar configuración compartida
  const { getCurrentRoomConfig, updateRoomConfig } = require('./config.js');

  if (req.method === 'GET') {
    const config = getCurrentRoomConfig();
    return res.json({ success: true, config: config });
  } else if (req.method === 'POST' || req.method === 'PUT') {
    const { roomType } = req.body;
    if (!roomType || !['small', 'medium', 'large'].includes(roomType)) {
      return res.status(400).json({ error: 'Invalid room type' });
    }
    
    const updated = updateRoomConfig(roomType);
    if (updated) {
      const config = getCurrentRoomConfig();
      return res.json({ 
        success: true, 
        message: `Sala configurada a: ${config.configs[roomType].name}`, 
        config: config 
      });
    } else {
      return res.status(400).json({ error: 'Failed to update room configuration' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// Asignar administrador
function handleAssignAdmin(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token.startsWith('admin-jwt-')) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { targetEmail, action } = req.body;
  if (!targetEmail || !action || !['grant', 'revoke'].includes(action)) {
    return res.status(400).json({ error: 'Invalid fields' });
  }

  return res.json({
    success: true,
    message: `Admin privileges ${action === 'grant' ? 'granted to' : 'revoked from'} ${targetEmail}`,
    user: {
      id: 'user-' + Date.now(),
      email: targetEmail,
      name: targetEmail.split('@')[0],
      is_admin: action === 'grant'
    }
  });
}

// Configurar primer administrador
function handleSetupFirstAdmin(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  return res.json({
    success: true,
    message: 'Primer administrador configurado exitosamente',
    user: {
      id: 'admin-' + Date.now(),
      email: email,
      name: name,
      is_admin: true
    },
    token: 'admin-jwt-' + Date.now() + '-admin-' + Date.now()
  });
}

// Prueba de API
function handleTest(req, res) {
  return res.json({
    success: true,
    message: 'Admin API endpoints are working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    endpoints: ['login', 'check-status', 'stats', 'room-config', 'assign-admin', 'setup-first-admin', 'test']
  });
}
