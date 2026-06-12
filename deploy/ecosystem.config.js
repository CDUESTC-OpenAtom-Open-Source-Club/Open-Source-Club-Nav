// deploy/ecosystem.config.js
// PM2 进程管理配置
const serverAddr = process.env.SERVER_ADDR || ':8080';
const backendPort = serverAddr.includes(':') ? serverAddr.split(':').pop() : serverAddr;
const backendApiUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || `http://127.0.0.1:${backendPort}`;
const goProxy = process.env.GOPROXY || 'https://goproxy.cn,direct';
const goSumDB = process.env.GOSUMDB || 'sum.golang.org https://goproxy.cn/sumdb/sum.golang.org';

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
        CONFIG_PATH: './config.yaml',
        SERVER_ADDR: serverAddr,
        GOTOOLCHAIN: process.env.GOTOOLCHAIN || 'auto',
        GOPROXY: goProxy,
        GOSUMDB: goSumDB,
        GOFLAGS: process.env.GOFLAGS || '-p=1',
        GOMAXPROCS: process.env.GOMAXPROCS || '1',
        MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || '',
        JWT_SECRET: process.env.JWT_SECRET || '',
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
        BACKEND_API_URL: backendApiUrl,
        NEXT_PUBLIC_BACKEND_API_URL: backendApiUrl,
      },
    },
  ],
};
