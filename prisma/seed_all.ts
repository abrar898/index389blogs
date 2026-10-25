import { execSync } from "child_process";

const scripts = [
  "prisma/seed.ts",
  "prisma/seed_writeups.ts",
  "prisma/insert_custom_writeups.ts",
  "prisma/insert_goodwords.ts",
  "scripts/rename-author.ts",
  "scripts/seed-cheatsheets-to-db.ts",
];

async function run() {
  console.log("=== POPULATING COMPLETE DATASET (ALL WRITEUPS, ARTICLES, CVES) ===");
  
  for (const script of scripts) {
    console.log(`\n========================================`);
    console.log(`>> Executing: ${script}`);
    console.log(`========================================`);
    try {
      execSync(`npx tsx ${script}`, { stdio: "inherit" });
      console.log(`✓ Successfully completed ${script}`);
    } catch (err: any) {
      console.error(`✕ Error executing ${script}:`, err?.message || err);
    }
  }
  
  console.log("\n========================================");
  console.log("🎉 ALL WRITE-UPS AND ARTICLES ARE NOW SEEDED IN SUPABASE!");
  console.log("========================================\n");
}

run();
