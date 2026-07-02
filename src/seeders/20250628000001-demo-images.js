import crypto from "crypto";

const uuidv4 = () => crypto.randomUUID();

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface) {
  const now = new Date();

  await queryInterface.bulkInsert("images", [
    {
      id: uuidv4(),
      title: "City Skyline",
      url: "https://picsum.photos/seed/city-skyline/800/600",
      description: "A stunning urban skyline at golden hour.",
      status: "open",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      title: "Mountain Lake",
      url: "https://picsum.photos/seed/mountain-lake/800/600",
      description: "Serene alpine lake surrounded by snow-capped peaks.",
      status: "open",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      title: "Beach Sunset",
      url: "https://picsum.photos/seed/beach-sunset/800/600",
      description: "Waves rolling in as the sun dips below the horizon.",
      status: "open",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      title: "Forest Trail",
      url: "https://picsum.photos/seed/forest-trail/800/600",
      description: "A winding path through a lush green forest.",
      status: "open",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      title: "Desert Dunes",
      url: "https://picsum.photos/seed/desert-dunes/800/600",
      description: "Rolling sand dunes under a vast open sky.",
      status: "closed",
      createdAt: now,
      updatedAt: now,
    },
  ]);
}

/** @type {import('sequelize-cli').Migration} */
export async function down(queryInterface) {
  await queryInterface.bulkDelete("images", null, {});
}
