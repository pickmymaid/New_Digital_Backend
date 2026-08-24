// PM2 config for running Backend1 and Backend2 directly on a VM, without
// Docker/Kubernetes — an alternative to docker-compose.microservices.yml
// and k8s/, not required by either of them. Run with:
//   pm2 start ecosystem.config.cjs --env production
module.exports = {
  apps: [
    {
      name: "backend1",
      cwd: "./Backend1",
      script: "./src/server.js",
      exec_mode: "cluster",
      instances: 2,
      autorestart: true,
      watch: false,
      max_memory_restart: "384M",
      env: {
        NODE_ENV: "production",
        PORT: 8080,
      },
    },
    {
      name: "backend2",
      cwd: "./Backend2",
      script: "./src/server.js",
      // Fixed at 1 instance: the subscription-expiry cron
      // (Backend2/src/utils/CronJob/Cronjob.js) runs in-process and would
      // double-process expiries under cluster mode with >1 instance.
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "256M",
      env: {
        NODE_ENV: "production",
        PORT: 8081,
      },
    },
  ],
};
