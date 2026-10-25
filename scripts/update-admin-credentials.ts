import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({
  datasourceUrl: dbUrl,
});

const NEW_ADMIN_EMAIL = "admin@index389.com";
const NEW_ADMIN_PASSWORD = "Arax0n@Index389!Sec2026";
const NEW_ADMIN_NAME = "Arax0n";

async function main() {
  console.log("Generating secure password hash...");
  const newHash = await bcrypt.hash(NEW_ADMIN_PASSWORD, 12);

  console.log("\n========================================================");
  console.log("SQL TO RUN IN SUPABASE SQL EDITOR (Instant & 100% Reliable):");
  console.log(`UPDATE "User" SET email = '${NEW_ADMIN_EMAIL}', name = '${NEW_ADMIN_NAME}', "passwordHash" = '${newHash}', "role" = 'ADMIN' WHERE role = 'ADMIN' OR email = 'admin@cybervault.local' OR email = '${NEW_ADMIN_EMAIL}';`);
  console.log("========================================================\n");

  console.log("Attempting direct connection to Supabase via port 5432...");

  try {
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { role: "ADMIN" },
          { email: "admin@cybervault.local" },
          { email: NEW_ADMIN_EMAIL },
        ],
      },
    });

  if (existingAdmin) {
    console.log(`Found existing admin user (ID: ${existingAdmin.id}, Email: ${existingAdmin.email})`);
    const updated = await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        email: NEW_ADMIN_EMAIL,
        name: NEW_ADMIN_NAME,
        passwordHash: newHash,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    console.log(`✓ Admin user updated successfully!`);
    console.log(`  Email: ${updated.email}`);
    console.log(`  Name:  ${updated.name}`);
  } else {
    console.log("Creating new admin user...");
    const created = await prisma.user.create({
      data: {
        email: NEW_ADMIN_EMAIL,
        name: NEW_ADMIN_NAME,
        passwordHash: newHash,
        role: "ADMIN",
        status: "ACTIVE",
        profile: {
          create: {
            interests: "Security Research, Exploit Development, Offensive Operations",
          },
        },
      },
    });
    console.log(`✓ Admin user created successfully (ID: ${created.id})`);
  }

    console.log("\n==================================================");
    console.log("NEW PRIVATE ADMIN CREDENTIALS CONFIGURED:");
    console.log(`Email:    ${NEW_ADMIN_EMAIL}`);
    console.log(`Password: ${NEW_ADMIN_PASSWORD}`);
    console.log("==================================================\n");
  } catch (err: any) {
    console.log("\n[Notice] Could not connect directly from this terminal (network/firewall).");
    console.log("Simply copy the SQL query printed above and run it in your Supabase SQL Editor!");
  }
}

main()
  .finally(async () => {
    try { await prisma.$disconnect(); } catch {}
  });
