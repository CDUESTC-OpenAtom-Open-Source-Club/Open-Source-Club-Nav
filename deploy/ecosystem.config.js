// deploy/ecosystem.config.js
// PM2 进程管理配置
const serverAddr = process.env.SERVER_ADDR || ':8080';
const backendPort = serverAddr.includes(':') ? serverAddr.split(':').pop() : serverAddr;
const backendApiUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || `http://127.0.0.1:${backendPort}`;
const goProxy = process.env.GOPROXY || 'https://proxy.golang.org,direct';
const goSumDB = process.env.GOSUMDB || 'sum.golang.org';

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
        MYSQL_HOST: process.env.MYSQL_HOST || '',
        MYSQL_PORT: process.env.MYSQL_PORT || '',
        MYSQL_USER: process.env.MYSQL_USER || '',
        MYSQL_DATABASE: process.env.MYSQL_DATABASE || '',
        MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || '',
        JWT_SECRET: process.env.JWT_SECRET || '',
        CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS || '',
        REDIS_ADDR: process.env.REDIS_ADDR || '',
        REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
        REDIS_DB: process.env.REDIS_DB || '',
        GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
        GITHUB_ORG: process.env.GITHUB_ORG || process.env.NEXT_PUBLIC_GITHUB_ORG || '',
        GITHUB_CACHE_TTL: process.env.GITHUB_CACHE_TTL || '',
        GITHUB_EVENTS_CACHE_TTL: process.env.GITHUB_EVENTS_CACHE_TTL || '',
        GITHUB_USERS_CACHE_TTL: process.env.GITHUB_USERS_CACHE_TTL || '',
        GITHUB_REPOS_CACHE_TTL: process.env.GITHUB_REPOS_CACHE_TTL || '',
        GITHUB_CONTRIBUTORS_CACHE_TTL: process.env.GITHUB_CONTRIBUTORS_CACHE_TTL || '',
        LINK_HEALTH_CACHE_TTL: process.env.LINK_HEALTH_CACHE_TTL || '',
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
        NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=180',
        NEXT_TELEMETRY_DISABLED: '1',
        BACKEND_API_URL: backendApiUrl,
        NEXT_PUBLIC_BACKEND_API_URL: backendApiUrl,
        GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
        NEXT_PUBLIC_GITHUB_ORG: process.env.NEXT_PUBLIC_GITHUB_ORG || process.env.GITHUB_ORG || '',
      },
    },
  ],
};
