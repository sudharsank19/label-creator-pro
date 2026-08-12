/* eslint-disable no-console */
// Removes test artifacts created by test-api.js so the seeded DB stays pristine.
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Remove labels created from import/test runs (names starting with Test/Batch/IP)
  const del = await prisma.label.deleteMany({
    where: {
      OR: [
        { name: { startsWith: "Test" } },
        { name: "BAT IP14" },
        { name: "LCD IP15" },
        { name: "BAT IP15" },
      ],
    },
  });
  console.log(`🗑️  Deleted ${del.count} test labels`);

  const users = await prisma.user.count();
  const labels = await prisma.label.count();

  // Remove templates created during tests (not the seeded one)
  const tdel = await prisma.template.deleteMany({
    where: { name: { not: "Standard Part Label (50x25mm)" } },
  });
  console.log(`🗑️  Deleted ${tdel.count} test templates`);

  // Remove print history created during tests
  const pdel = await prisma.printHistory.deleteMany({});
  console.log(`🗑️  Deleted ${pdel.count} print-history rows`);

  const templates = await prisma.template.count();
  const prints = await prisma.printHistory.count();
  const cats = await prisma.category.count();
  const settings = await prisma.setting.count();
  console.log(
    `📊 DB state → users:${users} labels:${labels} templates:${templates} prints:${prints} categories:${cats} settings:${settings}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
