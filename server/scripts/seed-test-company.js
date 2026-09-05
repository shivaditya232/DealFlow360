// One-off helper: creates a single test Company so you can test Jauth
// signup/login without waiting on the real seed data. Safe to delete later.
import prisma from "../src/config/prisma.js";

const SLUG = "test-co";

async function main() {
  const existing = await prisma.company.findUnique({ where: { slug: SLUG } });
  if (existing) {
    console.log(`Company already exists: id=${existing.id} slug=${existing.slug}`);
    return;
  }
  const company = await prisma.company.create({
    data: { name: "Test Company", slug: SLUG },
  });
  console.log(`Created company: id=${company.id} slug=${company.slug}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
