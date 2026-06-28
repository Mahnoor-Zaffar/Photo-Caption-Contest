import { DataTypes } from "sequelize";
import sequelize from "../config/sequelize.js";

const Vote = sequelize.define(
  "Vote",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    captionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "captions",
        key: "id",
      },
    },
  },
  {
    tableName: "votes",
    indexes: [
      {
        unique: true,
        fields: ["userId", "captionId"],
      },
    ],
  },
);

export default Vote;
