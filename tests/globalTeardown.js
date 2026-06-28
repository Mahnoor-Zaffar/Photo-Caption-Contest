import sequelize from "../src/config/sequelize.js";

export default async () => {
  await sequelize.close().catch(() => {});
};
