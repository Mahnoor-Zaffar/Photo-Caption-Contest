import { DataTypes } from "sequelize";
import sequelize from "../config/sequelize.js";

const Caption = sequelize.define(
  "Caption",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
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
    tableName: "captions",
    indexes: [
      {
        unique: true,
        fields: ["userId", "imageId"],
      },
    ],
  },
);

export default Caption;
