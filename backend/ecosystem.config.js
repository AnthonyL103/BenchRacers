module.exports = {
    apps: [
      {
        name: "benchracers-backend",
        script: "./server.js", // after compiling with tsc
        instances: 1,
        env: {
          NODE_ENV: "production",
          PORT: 3000
        }
      }
    ]
  };
  
