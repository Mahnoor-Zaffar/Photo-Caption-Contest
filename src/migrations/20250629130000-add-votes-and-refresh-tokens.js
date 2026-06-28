/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("users", "refreshToken", {
    type: Sequelize.STRING,
    allowNull: true,
  });

  await queryInterface.createTable("votes", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    captionId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "captions",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });

  await queryInterface.addIndex("votes", ["userId", "captionId"], {
    unique: true,
    name: "votes_userId_captionId_unique",
  });
}

/** @type {import('sequelize-cli').Migration} */
export async function down(queryInterface) {
  await queryInterface.dropTable("votes");
  await queryInterface.removeColumn("users", "refreshToken");
}
