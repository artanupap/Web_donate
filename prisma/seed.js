const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("admin1234", 10);
  await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", password: hash },
  });

  for (const name of ["อาวุธ", "ยานพาหนะ", "ชุด", "ไอเท็มทั่วไป"]) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const siteSettings = [
    { key: "site_name", value: "FiveM Shop" },
    { key: "bank_name", value: "กสิกรไทย" },
    { key: "bank_account", value: "xxx-x-xxxxx-x" },
    { key: "bank_owner", value: "ชื่อเจ้าของ" },
    { key: "points_per_baht", value: "1" },
    { key: "fivem_api_url", value: "http://localhost:30120" },
    { key: "fivem_api_key", value: "your_secret_key" },
    { key: "promptpay_id", value: "" },
  ];
  for (const s of siteSettings) {
    await prisma.siteSetting.upsert({ where: { key: s.key }, update: {}, create: s });
  }

  console.log("Seed done — admin: admin / admin1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
