module.exports = {
  apps: [
    {
      name: 'memeForgeBackend',
      script: './backend/server.js',
      cwd: '/root/meme-token',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      max_memory_restart: '1G',
      error_file: '/root/.pm2/logs/backend-error.log',
      out_file: '/root/.pm2/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      ignore_watch: ['node_modules', 'build', '.git'],
      listen_timeout: 10000,
      kill_timeout: 5000
    },
    {
      name: 'meme-frontend',
      script: './frontend/server.js',
      cwd: '/root/meme-token',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      max_memory_restart: '512M',
      error_file: '/root/.pm2/logs/frontend-error.log',
      out_file: '/root/.pm2/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      ignore_watch: ['node_modules', 'build', '.git'],
      listen_timeout: 10000,
      kill_timeout: 5000
    }
  ],
  
  // Deploy configuration (optional)
  deploy: {
    production: {
      user: 'root',
      host: '92.249.61.60',
      ref: 'origin/main',
      repo: 'https://github.com/joker12-dev/meme-forge.git',
      path: '/root/meme-token',
      'post-deploy': 'cd backend && npm install --legacy-peer-deps && npx prisma generate && npx prisma db push && cd ../frontend && npm install && npm run build && pm2 restart all'
    }
  }
};
