require("dotenv").config();

module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: "postgres",
    logging: false,
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: process.env.DATABASE_URL?.includes("localhost")
        ? false
        : {
            require: true,
            rejectUnauthorized: false,
          },
    },
  },
};
