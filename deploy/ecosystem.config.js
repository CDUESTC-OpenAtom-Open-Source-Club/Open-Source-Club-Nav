// deploy/ecosystem.config.js
// PM2 进程管理配置
module.exports = {
  apps: [
    {
      name: 'openatom-backend',
      script: './bin/openatom-backend-linux-amd64',
      cwd: './backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '96M',
      env: {
        GIN_MODE: 'release',
        CONFIG_PATH: './config.prod.yaml',
      },
    },
    {
      name: 'openatom-web',
      script: './server.js',
      cwd: './frontend/apps/web/dist',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        PORT: '4000',
        HOSTNAME: '0.0.0.0',
        NEXT_TELEMETRY_DISABLED: '1',
        NEXT_PUBLIC_BACKEND_API_URL: 'http://127.0.0.1:8080',
      },
    },
  ],
};
