module.exports = {
    apps: [
      {
        name: "benchracers-backend",
        script: "./server.js", 
        instances: 1,
        env_file: '.env',
        env: {
          NODE_ENV: "production",
          PORT: 3000
        }
      }
    ]
  };
  
