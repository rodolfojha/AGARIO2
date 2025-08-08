module.exports = {
    host: "0.0.0.0",
    port: 3000,
    // Configuración del dominio
    domain: process.env.DOMAIN || "tu-dominio.com", // Reemplaza con tu dominio
    cors: {
        origin: [
            "https://tu-dominio.com", // Tu dominio principal
            "https://www.tu-dominio.com", // Con www
            "https://tu-proyecto.vercel.app", // Tu dominio de Vercel
            "http://localhost:3000", // Para desarrollo local
            "http://localhost:5000" // Para desarrollo local
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
