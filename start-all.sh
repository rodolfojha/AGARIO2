#!/bin/bash

# Script para iniciar todo el proyecto AGARIO2 en VPS
echo "🚀 Iniciando AGARIO2 VPS Setup..."

# Verificar que existe el archivo .env
if [ ! -f .env ]; then
    echo "❌ Archivo .env no encontrado. Creando desde plantilla..."
    cp env.example .env
    echo "⚠️  IMPORTANTE: Edita el archivo .env con tus configuraciones antes de continuar"
    exit 1
fi

echo "✅ Archivo .env encontrado"

# Cargar variables de entorno
source .env

# Verificar que Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

echo "✅ Node.js encontrado: $(node -v)"

# Verificar que las dependencias están instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Verificar que PM2 está instalado globalmente
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2 globalmente..."
    npm install -g pm2
fi

echo "✅ PM2 encontrado: $(pm2 -v)"

# Hacer ejecutables los scripts
chmod +x start-api.js
chmod +x start-game.js

echo "🔥 Iniciando servidores con PM2..."

# Detener procesos anteriores si existen
pm2 delete agario-api 2>/dev/null || true
pm2 delete agario-game 2>/dev/null || true

# Iniciar API Server (puerto 3000)
pm2 start start-api.js --name "agario-api" --log-date-format="YYYY-MM-DD HH:mm:ss"

# Iniciar Game Server (puerto 3001)
pm2 start start-game.js --name "agario-game" --log-date-format="YYYY-MM-DD HH:mm:ss"

# Mostrar estado
pm2 list

echo ""
echo "🎉 AGARIO2 VPS iniciado correctamente!"
echo ""
echo "📊 URLs de acceso:"
echo "   Frontend/API: http://$(hostname -I | awk '{print $1}') (puerto 80 via nginx)"
echo "   API directa:  http://$(hostname -I | awk '{print $1}'):3000"
echo "   Game Server:  http://$(hostname -I | awk '{print $1}'):8080 (puerto 8080 via nginx)"
echo "   Game directo: http://$(hostname -I | awk '{print $1}'):3001"
echo ""
echo "📝 Comandos útiles:"
echo "   pm2 list          - Ver estado de procesos"
echo "   pm2 logs          - Ver logs de todos los procesos"
echo "   pm2 logs agario-api   - Ver logs del API"
echo "   pm2 logs agario-game  - Ver logs del juego"
echo "   pm2 restart all   - Reiniciar todos los procesos"
echo "   pm2 stop all      - Detener todos los procesos"
echo ""
echo "⚠️  IMPORTANTE: Configura Nginx ejecutando:"
echo "   sudo cp nginx-config.conf /etc/nginx/sites-available/agario"
echo "   sudo ln -sf /etc/nginx/sites-available/agario /etc/nginx/sites-enabled/"
echo "   sudo rm -f /etc/nginx/sites-enabled/default"
echo "   sudo nginx -t && sudo systemctl reload nginx"


