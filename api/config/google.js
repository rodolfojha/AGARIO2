module.exports = (req, res) => {
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
    // Obtener Client ID de las variables de entorno
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    console.log('🔧 Google config request:', {
      hasClientId: !!clientId,
      clientIdLength: clientId ? clientId.length : 0
    });

    if (!clientId) {
      // Para desarrollo, usar el valor directo
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
};
