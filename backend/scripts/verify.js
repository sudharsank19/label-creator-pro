/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  const templateCount = await prisma.template.count();
  const settingCount = await prisma.setting.count();
  const categoryCount = await prisma.category.count();
  const printCount = await prisma.printHistory.count();
  const labelCount = await prisma.label.count();

  console.log("=== Database verification ===");
  console.log("users:", userCount);
  console.log("templates:", templateCount);
  console.log("settings:", settingCount);
  console.log("categories:", categoryCount);
  console.log("printHistory:", printCount);
  console.log("labels:", labelCount);

  const users = await prisma.user.findMany({
    select: { username: true, role: true, isActive: true, password: true },
  });
  console.log(
    "user list:",
    users.map((u) => ({ ...u, password: "***" })),
  );

  const templates = await prisma.template.findMany({
    select: { name: true, isDefault: true },
  });
  console.log("template list:", templates);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
