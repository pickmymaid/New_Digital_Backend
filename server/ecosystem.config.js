module.exports = {
    apps: [
      {
        name: "api-server",
        script: "./src/server.js",
        // Cluster mode for 2 CPU machine
        exec_mode: "cluster",
        instances: 2,
        autorestart: true,
        watch: false,
        max_memory_restart: "512M",
        env: {
          NODE_ENV: "production"
        }
      }
    ]
  };
  