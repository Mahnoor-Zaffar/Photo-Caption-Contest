/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("images", "status", {
    type: Sequelize.ENUM("open", "closed"),
    allowNull: false,
    defaultValue: "open",
  });

  await queryInterface.addColumn("captions", "voteCount", {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });

  await queryInterface.sequelize.query(`
    UPDATE captions c
    SET "voteCount" = (
      SELECT COUNT(*)::int FROM votes v WHERE v."captionId" = c.id
    )
  `);

  await queryInterface.addIndex("captions", ["imageId", "createdAt"], {
    name: "captions_imageId_createdAt_idx",
  });

  await queryInterface.addIndex("captions", ["imageId", "voteCount"], {
    name: "captions_imageId_voteCount_idx",
  });

  await queryInterface.addIndex("votes", ["imageId"], {
    name: "votes_imageId_idx",
  });

  await queryInterface.sequelize.query(`
    UPDATE images SET status = 'closed' WHERE title = 'Desert Dunes'
  `);
}

/** @type {import('sequelize-cli').Migration} */
export async function down(queryInterface) {
  await queryInterface.removeIndex("votes", "votes_imageId_idx");
  await queryInterface.removeIndex("captions", "captions_imageId_voteCount_idx");
  await queryInterface.removeIndex("captions", "captions_imageId_createdAt_idx");
  await queryInterface.removeColumn("captions", "voteCount");
  await queryInterface.removeColumn("images", "status");
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_images_status";');
}
