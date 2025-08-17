# AGARIO2 VPS Setup

Este documento describe cómo configurar el proyecto AGARIO2 completamente en un VPS, incluyendo tanto el frontend como el backend.

## 🏗️ Arquitectura

- **API Server** (Puerto 3000): Maneja las APIs REST, autenticación y sirve archivos estáticos
- **Game Server** (Puerto 3001): Maneja el juego real con Socket.IO
- **Nginx**: Proxy reverso que expone ambos servicios al exterior
- **PM2**: Gestor de procesos para mantener los servidores ejecutándose

## 📋 Prerrequisitos

- Ubuntu/Debian VPS
- Node.js 22.x
- Nginx
- Acceso root o sudo

## 🚀 Instalación Rápida

### 1. Configurar variables de entorno

```bash
# Editar el archivo .env con tus configuraciones
nano .env
```

Actualiza especialmente:
- `DOMAIN=tu-dominio.com`
- `JWT_SECRET=un_secreto_muy_seguro`

### 2. Ejecutar script de inicio

```bash
./start-all.sh
```

Este script:
- ✅ Verifica dependencias
- ✅ Instala PM2 si no está instalado
- ✅ Inicia ambos servidores
- ✅ Configura logs y monitoreo

### 3. Configurar Nginx

```bash
# Copiar configuración de Nginx
sudo cp nginx-config.conf /etc/nginx/sites-available/agario

# Habilitar el sitio
sudo ln -sf /etc/nginx/sites-available/agario /etc/nginx/sites-enabled/

# Desactivar sitio por defecto
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar configuración y recargar
sudo nginx -t && sudo systemctl reload nginx
```

## 🌐 URLs de Acceso

Después de la configuración:

- **Frontend**: `http://tu-ip/` (Puerto 80)
- **API**: `http://tu-ip/api/` (Puerto 80, proxy a 3000)
- **Game Server**: `http://tu-ip:8080/` (Puerto 8080, proxy a 3001)

## 🔧 Configuración Manual

### Instalación paso a paso

```bash
# 1. Instalar dependencias
npm install

# 2. Instalar PM2 globalmente
npm install -g pm2

# 3. Instalar dependencias del game server
cd game-server && npm install && cd ..

# 4. Iniciar con PM2
pm2 start ecosystem.config.js

# 5. Guardar configuración PM2
pm2 save
pm2 startup
```

### Scripts disponibles

```bash
# Iniciar solo API
npm run start:api

# Iniciar solo Game Server
npm run start:game

# Iniciar ambos en desarrollo
npm run dev

# Iniciar ambos en producción
npm run start:all
```

## 📊 Monitoreo

### Comandos PM2 útiles

```bash
# Ver estado de procesos
pm2 list

# Ver logs en tiempo real
pm2 logs

# Ver logs específicos
pm2 logs agario-api
pm2 logs agario-game

# Reiniciar procesos
pm2 restart agario-api
pm2 restart agario-game
pm2 restart all

# Detener procesos
pm2 stop all
pm2 delete all
```

### Ubicación de logs

- API: `./logs/api-*.log`
- Game: `./logs/game-*.log`

## 🔒 Configuración de Firewall

```bash
# Permitir puertos necesarios
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 8080
sudo ufw enable
```

## 🔧 Troubleshooting

### Problema: Los servidores no inician

1. Verificar variables de entorno: `cat .env`
2. Verificar logs: `pm2 logs`
3. Verificar puertos: `netstat -tlnp | grep :3000`

### Problema: No se puede conectar desde el navegador

1. Verificar Nginx: `sudo nginx -t`
2. Verificar estado: `sudo systemctl status nginx`
3. Verificar firewall: `sudo ufw status`

### Problema: Socket.IO no conecta

1. Verificar puerto 8080 abierto
2. Verificar configuración CORS en `game-server/config.js`
3. Verificar logs del game server: `pm2 logs agario-game`

## 📝 Configuraciones importantes

### CORS
El frontend se configura automáticamente para usar las URLs correctas según el hostname.

### Puertos
- **Desarrollo**: API en 3000, Game en 3001
- **Producción**: Nginx proxy en 80 y 8080

### Variables de entorno importantes
- `API_PORT`: Puerto del servidor API (default: 3000)
- `GAME_PORT`: Puerto del servidor de juego (default: 3001)
- `DOMAIN`: Tu dominio principal
- `NODE_ENV`: production/development

## 🔄 Actualizaciones

Para actualizar el código:

```bash
# Detener procesos
pm2 stop all

# Actualizar código (git pull, etc.)
# ...

# Reiniciar
pm2 start all
```

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs: `pm2 logs`
2. Verifica la configuración: `pm2 list`
3. Verifica Nginx: `sudo nginx -t`


