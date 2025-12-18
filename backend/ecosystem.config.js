/**
 * Configuration PM2 pour production Debian
 * 
 * Installation PM2: npm install -g pm2
 * 
 * Commandes utiles:
 * - pm2 start ecosystem.config.js --env production
 * - pm2 stop unlock-backend
 * - pm2 restart unlock-backend
 * - pm2 logs unlock-backend
 * - pm2 monit
 * - pm2 save (sauvegarder la config pour démarrage auto)
 * - pm2 startup (configurer le démarrage au boot)
 */

module.exports = {
  apps: [
    {
      name: 'unlock-backend',
      script: './dist/server.js',
      cwd: './',
      instances: 'max', // Utiliser tous les CPU disponibles
      exec_mode: 'cluster', // Mode cluster pour utiliser tous les CPU
      autorestart: true,
      watch: false, // Désactivé en production
      max_memory_restart: '500M', // Redémarrer si > 500MB RAM
      env: {
        NODE_ENV: 'development',
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      // Logs
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true, // Ajouter timestamp aux logs
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Restart policy
      min_uptime: '10s', // Temps minimum avant de considérer le démarrage réussi
      max_restarts: 10, // Max 10 redémarrages
      restart_delay: 4000, // Délai entre redémarrages (4s)
      
      // Graceful shutdown
      kill_timeout: 5000, // Temps d'attente avant kill forcé (5s)
      listen_timeout: 10000, // Temps d'attente pour que l'app écoute (10s)
      shutdown_with_message: true,
      
      // Monitoring
      pmx: true, // Activer PMX pour monitoring
    },
  ],
};

