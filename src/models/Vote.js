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
    imageId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "images",
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
      {
        unique: true,
        fields: ["userId", "imageId"],
      },
    ],
  },
);

export default Vote;
