module.exports = {
  apps: [
    {
      name: "backend-api",
      cwd: "/var/www/lv4-cap-backend",
      script: "src/index.js",
      env: {
        NODE_ENV: "dev",
        SERVICE_NAME: "backend-api",
        LOKI_HOST: "http://127.0.0.1:3110",
        LOG_LEVEL: "info",
      },
    },
    {
      name: "weather",
      cwd: "/var/www/lv4-cap-ms-wx",
      script: "src/index.js",
      env: {
        NODE_ENV: "dev",
        SERVICE_NAME: "weather",
        LOKI_HOST: "http://127.0.0.1:3110",
        LOG_LEVEL: "info",
      },
    },
    {
      name: "lv4.ai",
      cwd: "/var/www/lv4-cap-ms-ai",
      script: "src/index.js",
      env: {
        NODE_ENV: "dev",
        SERVICE_NAME: "lv4.ai",
        LOKI_HOST: "http://127.0.0.1:3110",
        LOG_LEVEL: "info",
      },
    },
  ],
}
