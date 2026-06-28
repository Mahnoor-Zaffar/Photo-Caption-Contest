/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("votes", "imageId", {
    type: Sequelize.UUID,
    allowNull: true,
    references: {
      model: "images",
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });

  await queryInterface.sequelize.query(`
    UPDATE votes v
    SET "imageId" = c."imageId"
    FROM captions c
    WHERE v."captionId" = c.id
  `);

  await queryInterface.changeColumn("votes", "imageId", {
    type: Sequelize.UUID,
    allowNull: false,
    references: {
      model: "images",
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });

  await queryInterface.addIndex("votes", ["userId", "imageId"], {
    unique: true,
    name: "votes_userId_imageId_unique",
  });
}

/** @type {import('sequelize-cli').Migration} */
export async function down(queryInterface) {
  await queryInterface.removeIndex("votes", "votes_userId_imageId_unique");
  await queryInterface.removeColumn("votes", "imageId");
}
