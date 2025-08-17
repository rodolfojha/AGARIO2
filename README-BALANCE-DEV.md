# 💰 Funcionalidad de Recarga de Saldo - Usuario DEV

Este sistema permite recargar saldo fácilmente para el usuario de desarrollo y mostrar el monto de la apuesta en el círculo del jugador.

## 🚀 Scripts Disponibles

### 1. `add_balance_dev.js` - Recarga Principal
Script principal para recargar saldo del usuario dev.

**Uso:**
```bash
# Recarga por defecto ($100)
node add_balance_dev.js

# Recarga personalizada
node add_balance_dev.js 500

# Recarga para usuario específico
node add_balance_dev.js 1000 dev-user-123

# Mostrar ayuda
node add_balance_dev.js --help
```

**Características:**
- ✅ Crea usuario dev automáticamente si no existe
- ✅ Agrega balance de forma segura
- ✅ Registra transacciones en la base de datos
- ✅ Muestra balance antes y después
- ✅ Colores en consola para mejor visualización
- ✅ Manejo de errores robusto

### 2. `test_balance.js` - Pruebas Automáticas
Script para probar la funcionalidad con diferentes montos.

**Uso:**
```bash
node test_balance.js
```

## 🎮 Visualización de Apuestas en el Juego

### Características Implementadas:
- **Valor en Círculo**: Muestra el valor actual de cada círculo del jugador
- **ROI en Tiempo Real**: Porcentaje de ganancia/pérdida
- **Colores Dinámicos**: 
  - 🟢 Verde: Ganando dinero
  - 🔴 Rojo: Perdiendo dinero
  - 🟡 Dorado: Valor actual

### Ubicación de la Información:
- **Nombre del jugador**: En el centro del círculo
- **Valor actual**: Debajo del nombre en dorado
- **ROI**: Debajo del valor (verde/rojo según rendimiento)

## 🔧 Configuración

### Usuario DEV por Defecto:
- **ID**: `dev-user-123`
- **Email**: `dev@example.com`
- **Nombre**: `Dev User`
- **Permisos**: Admin + Dev

### Base de Datos:
- **Archivo**: `database.json`
- **Estructura**: Usuarios, transacciones, juegos, pagos
- **Backup**: Se crea automáticamente si no existe

## 📊 Estructura de Transacciones

Cada recarga crea una transacción con:
```json
{
  "id": "tx_timestamp_random",
  "userId": "dev-user-123",
  "type": "deposit",
  "amount": 100,
  "description": "Balance agregado manualmente - Script de recarga DEV",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "metadata": {
    "method": "manual_script",
    "admin_action": true,
    "script": "add_balance_dev.js"
  }
}
```

## 🎯 Flujo de Uso

### 1. Recargar Saldo:
```bash
# Recarga rápida de $100
node add_balance_dev.js

# Recarga personalizada
node add_balance_dev.js 500
```

### 2. Verificar en el Juego:
- Abrir el juego en el navegador
- El balance se actualiza automáticamente
- Las apuestas muestran el valor en tiempo real

### 3. Monitorear Transacciones:
- Todas las recargas quedan registradas
- Se puede ver el historial en `database.json`

## 🚨 Solución de Problemas

### Error: "Base de datos no encontrada"
- El script crea automáticamente una nueva base de datos
- No es un error, es normal en la primera ejecución

### Error: "Usuario no encontrado"
- El script crea automáticamente el usuario dev
- Verificar que el ID del usuario sea correcto

### Balance no se actualiza en el juego
- Refrescar la página del juego
- Verificar que el usuario esté logueado
- Revisar la consola del navegador para errores

## 🔄 Integración con el Juego

### Archivos Modificados:
- `public/game/js/render.js` - Visualización de valores
- `add_balance_dev.js` - Script de recarga
- `test_balance.js` - Pruebas automáticas

### Funciones Clave:
- `getBettingValues()` - Obtiene valores de apuesta
- `drawCells()` - Dibuja células con valores
- `addBalanceDirectly()` - Recarga saldo

## 📈 Próximas Mejoras

- [ ] Panel web para recargas (sin consola)
- [ ] Historial de transacciones visual
- [ ] Gráficos de rendimiento
- [ ] Notificaciones en tiempo real
- [ ] Exportar datos de transacciones

## 🆘 Soporte

Para problemas o preguntas:
1. Revisar la consola del navegador
2. Verificar logs del script
3. Comprobar permisos de archivos
4. Validar estructura de la base de datos

---

**🎮 ¡Disfruta del juego con saldo ilimitado para desarrollo!**
