#!/bin/bash

echo "🔍 AGARIO2 VPS Status Check"
echo "=============================="
echo

# Verificar procesos PM2
echo "📊 PM2 Processes:"
pm2 list
echo

# Verificar puertos
echo "🌐 Port Status:"
echo "API Server (3000):"
netstat -tlnp | grep :3000 || echo "❌ Port 3000 not listening"

echo "Game Server (3001):"
netstat -tlnp | grep :3001 || echo "❌ Port 3001 not listening"

echo "Nginx (80):"
netstat -tlnp | grep :80 || echo "❌ Port 80 not listening"

echo "Nginx Game Proxy (8080):"
netstat -tlnp | grep :8080 || echo "❌ Port 8080 not listening"
echo

# Verificar servicios
echo "🧪 Service Tests:"

echo "Testing API..."
API_TEST=$(curl -s http://localhost:3000/api/test)
if echo "$API_TEST" | grep -q "success"; then
    echo "✅ API Server: Working"
else
    echo "❌ API Server: Failed"
fi

echo "Testing Frontend..."
FRONTEND_TEST=$(curl -s http://localhost/ | head -5)
if echo "$FRONTEND_TEST" | grep -q "html"; then
    echo "✅ Frontend: Working"
else
    echo "❌ Frontend: Failed"
fi

echo "Testing Nginx API Proxy..."
NGINX_API_TEST=$(curl -s http://localhost/api/test)
if echo "$NGINX_API_TEST" | grep -q "success"; then
    echo "✅ Nginx API Proxy: Working"
else
    echo "❌ Nginx API Proxy: Failed"
fi

echo "Testing Game Server..."
GAME_TEST=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001)
if [ "$GAME_TEST" = "200" ]; then
    echo "✅ Game Server: Working"
else
    echo "❌ Game Server: Failed (HTTP $GAME_TEST)"
fi
echo

# Mostrar URLs
echo "🌐 Access URLs:"
IP=$(hostname -I | awk '{print $1}')
echo "   Frontend:     http://$IP/"
echo "   API:          http://$IP/api/"
echo "   Game (proxy): http://$IP:8080/"
echo "   API Direct:   http://$IP:3000/"
echo "   Game Direct:  http://$IP:3001/"
echo

# Verificar archivos de configuración
echo "📄 Configuration Status:"
if [ -f ".env" ]; then
    echo "✅ .env file exists"
else
    echo "❌ .env file missing"
fi

if [ -f "/etc/nginx/sites-enabled/agario" ]; then
    echo "✅ Nginx configuration active"
else
    echo "❌ Nginx configuration not active"
fi

echo
echo "🛠️  Quick Commands:"
echo "   pm2 logs           - View all logs"
echo "   pm2 restart all    - Restart all services"
echo "   ./start-all.sh     - Full restart"
echo "   ./check-status.sh  - Run this check again"


