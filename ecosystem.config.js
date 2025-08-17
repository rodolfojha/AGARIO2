module.exports = {
  apps: [
    {
      name: 'agario-api',
      script: './start-api.js',
      cwd: '/home/ubuntu/AGARIO2',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        API_PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        API_PORT: 3000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log'
    },
    {
      name: 'agario-game',
      script: './start-game.js',
      cwd: '/home/ubuntu/AGARIO2',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        GAME_PORT: 3001
      },
      env_development: {
        NODE_ENV: 'development',
        GAME_PORT: 3001
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/game-error.log',
      out_file: './logs/game-out.log',
      log_file: './logs/game-combined.log'
    }
  ]
};


