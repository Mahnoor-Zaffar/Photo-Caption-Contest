import dotenv from "dotenv";
import { execSync } from "child_process";
import app from "./app.js";
import sequelize from "./config/sequelize.js";
import { Image } from "./models/index.js";

dotenv.config();

const PORT = process.env.PORT || 8000;

const runMigrations = () => {
  try {
    execSync("npx sequelize-cli db:migrate", { stdio: "inherit" });
  } catch (error) {
    console.error("Migration failed:", error.message);
    throw error;
  }
};

const runSeedersIfNeeded = async () => {
  const imageCount = await Image.count();

  if (imageCount === 0) {
    execSync("npx sequelize-cli db:seed:all", { stdio: "inherit" });
  }
};

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connected");

    runMigrations();
    await runSeedersIfNeeded();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
