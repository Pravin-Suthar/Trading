module.exports = {
    HOST: "localhost",
    USER: "root",
    PASSWORD: "root",
    DB: "hft_analytics",
    dialect: "mysql", // Specify the dialect here
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };
  