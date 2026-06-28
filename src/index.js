import dotenv from "dotenv";
import { execSync } from "child_process";
import app from "./app.js";
import sequelize from "./config/sequelize.js";
import { validateEnv } from "./config/env.js";
import logger from "./config/logger.js";
import { Image } from "./models/index.js";

dotenv.config();
validateEnv();

const PORT = process.env.PORT || 8000;

const runSeedersIfNeeded = async () => {
  const imageCount = await Image.count();

  if (imageCount === 0) {
    execSync("npx sequelize-cli db:seed:all", { stdio: "inherit" });
  }
};

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info("PostgreSQL connected");

    await runSeedersIfNeeded();

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Swagger docs at http://localhost:${PORT}/api-docs`);
      logger.info(`Frontend at http://localhost:${PORT}/`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        logger.error(`Port ${PORT} is already in use. Stop the other process and restart.`);
      }
      throw error;
    });

    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        await sequelize.close().catch(() => {});
        logger.info("Server closed");
        process.exit(0);
      });
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error({ err: error }, "Failed to start server");
    process.exit(1);
  }
};

startServer();
