/** @type {import('sequelize-cli').Migration} */
const dropContestTables = async (queryInterface) => {
  await queryInterface.sequelize.query(
    'DROP TABLE IF EXISTS "captions" CASCADE;',
  );
  await queryInterface.sequelize.query(
    'DROP TABLE IF EXISTS "images" CASCADE;',
  );
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS "users" CASCADE;');
};

const createContestTables = async (queryInterface, Sequelize) => {
  await queryInterface.createTable("users", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
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

  await queryInterface.createTable("images", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    url: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
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

  await queryInterface.createTable("captions", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    text: {
      type: Sequelize.TEXT,
      allowNull: false,
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
    imageId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "images",
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

  await queryInterface.addIndex("captions", ["userId", "imageId"], {
    unique: true,
    name: "captions_userId_imageId_unique",
  });
};

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  const tables = await queryInterface.showAllTables();

  let userIdType = null;
  if (tables.includes("users")) {
    const [rows] = await queryInterface.sequelize.query(
      `SELECT data_type FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id'
       LIMIT 1`,
    );
    userIdType = rows[0]?.data_type ?? null;
  }

  const needsReset =
    !tables.includes("users") ||
    !tables.includes("images") ||
    !tables.includes("captions") ||
    userIdType !== "uuid";

  if (needsReset) {
    await dropContestTables(queryInterface);
    await createContestTables(queryInterface, Sequelize);
  }
}

/** @type {import('sequelize-cli').Migration} */
export async function down(queryInterface) {
  await dropContestTables(queryInterface);
}
