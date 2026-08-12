/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const DEFAULT_SETTINGS = {
  companyName: "iTech Service Center",
  companyAddress: "123 Main Street, City",
  companyPhone: "+1 555-000-1234",
  companyEmail: "support@itech.example",
  defaultWidth: "50",
  defaultHeight: "25",
  defaultPrinter: "thermal",
  defaultCopies: "1",
  theme: "light",
  barcodeType: "CODE128",
  qrEnabled: "true",
  qrErrorLevel: "M",
};

const SAMPLE_TEMPLATE_ELEMENTS = [
  {
    id: "el-text-model",
    type: "text",
    x: 4,
    y: 3,
    width: 42,
    height: 6,
    text: "Model: {{model}}",
    fontSize: 10,
    bold: true,
    color: "#1c1c1e",
    align: "left",
  },
  {
    id: "el-text-product",
    type: "text",
    x: 4,
    y: 10,
    width: 42,
    height: 5,
    text: "Product: {{product}}",
    fontSize: 8,
    bold: false,
    color: "#3a3a3c",
    align: "left",
  },
  {
    id: "el-barcode",
    type: "barcode",
    x: 4,
    y: 15,
    width: 42,
    height: 9,
    value: "{{barcode}}",
    fontsize: 7,
    text: "{{barcode}}",
    bcid: "code128",
    heightmm: 8,
    includeText: true,
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Seed admin + staff users if none exist
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const password = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        username: "admin",
        password,
        fullName: "Administrator",
        role: "admin",
        email: "admin@itech.example",
        phone: "+1 555-000-0000",
        isActive: true,
      },
    });
    console.log("✅ Created admin / admin123");
  }

  // Seed default settings
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    const existing = await prisma.setting.findUnique({ where: { key } });
    if (!existing) {
      await prisma.setting.create({ data: { key, value } });
    }
  }
  console.log("✅ Seeded settings");

  // Seed categories
  const categories = [
    { name: "Display / Screen", color: "#0a84ff" },
    { name: "Battery", color: "#34c759" },
    { name: "Camera", color: "#ff9f0a" },
    { name: "Charging Port", color: "#ff2d55" },
    { name: "Audio", color: "#af52de" },
    { name: "Motherboard", color: "#64d2ff" },
    { name: "Accessories", color: "#8e8e93" },
  ];
  for (const c of categories) {
    const existing = await prisma.category.findUnique({
      where: { name: c.name },
    });
    if (!existing) {
      await prisma.category.create({ data: c });
    }
  }
  console.log("✅ Seeded categories");

  // Seed a sample template if none exist
  const templateCount = await prisma.template.count();
  if (templateCount === 0) {
    await prisma.template.create({
      data: {
        name: "Standard Part Label (50x25mm)",
        description: "Default label with part number barcode",
        width: 50,
        height: 25,
        background: "#ffffff",
        elements: JSON.stringify(SAMPLE_TEMPLATE_ELEMENTS),
        isDefault: true,
      },
    });
    console.log("✅ Seeded sample template");
  }

  console.log("🎉 Database seeding complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
