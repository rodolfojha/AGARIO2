module.exports = (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  // Login simple
  if (email === 'rodolfoalva1345@gmail.com' && password === 'admin123') {
    return res.json({
      success: true,
      message: 'Login exitoso',
      token: 'admin-token-' + Date.now(),
      user: {
        id: 'admin-123',
        email: email,
        name: 'Rodolfo Alvarez',
        is_admin: true
      }
    });
  }

  return res.status(401).json({ error: 'Credenciales inválidas' });
};
