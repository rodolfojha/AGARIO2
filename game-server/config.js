module.exports = {
    host: "0.0.0.0",
    port: process.env.GAME_PORT || 3001,
    // Configuración del dominio
    domain: process.env.DOMAIN || "tu-dominio.com", // Reemplaza con tu dominio
    cors: {
        origin: [
            "https://tu-dominio.com", // Tu dominio principal
            "https://www.tu-dominio.com", // Con www
            "http://localhost:3000", // Para desarrollo local
            "http://localhost:5000", // Para desarrollo local
            function(origin, callback) {
                // Permitir cualquier origen del mismo hostname en producción
                if (!origin) return callback(null, true);
                const hostname = new URL(origin).hostname;
                if (hostname === process.env.DOMAIN || hostname.includes('localhost')) {
                    callback(null, true);
                } else {
                    callback(null, true); // Por ahora permitimos todo para VPS
                }
            }
        ],
        credentials: true
    },
    logpath: "logger.php",
    foodMass: 1,
    fireFood: 20,
    limitSplit: 16,
    defaultPlayerMass: 10,
	virus: {
        fill: "#33ff33",
        stroke: "#19D119",
        strokeWidth: 20,
        defaultMass: {
            from: 100,
            to: 150
        },
        splitMass: 180,
        uniformDisposition: false,
	},
    gameWidth: 5000,
    gameHeight: 5000,
    adminPass: "DEFAULT",
    gameMass: 20000,
    maxFood: 1000,
    maxVirus: 50,
    slowBase: 4.5,
    logChat: 0,
    networkUpdateFactor: 40,
    maxHeartbeatInterval: 5000,
    foodUniformDisposition: true,
    newPlayerInitialPosition: "farthest",
    massLossRate: 1,
    minMassLoss: 50,
    sqlinfo: {
      fileName: "db.sqlite3",
    }
};
