const { execSync } = require("child_process");

const envs = [
  {
    key: "DATABASE_URL",
    value: "postgresql://postgres.khoztbgdarczordocjrx:SqgL66MR_7*D%2C8L@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
  },
  {
    key: "DIRECT_URL",
    value: "postgresql://postgres.khoztbgdarczordocjrx:SqgL66MR_7*D%2C8L@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres"
  },
  {
    key: "JWT_SECRET",
    value: "cybervault-super-secure-jwt-secret-key-replace-in-production-2026"
  },
  {
    key: "NEXT_PUBLIC_SITE_NAME",
    value: "Index 389"
  },
  {
    key: "STORAGE_TYPE",
    value: "local"
  },
  {
    key: "NEXT_PUBLIC_APP_URL",
    value: "https://blogs-index389.vercel.app"
  },
  {
    key: "PRIVATE_ARTICLE_CODE",
    value: "IDX#389!OpSec_Vault9x"
  }
];

console.log("Setting up Vercel environment variables for Production & Preview...\n");

for (const env of envs) {
  for (const target of ["production", "preview"]) {
    try {
      console.log(`Adding ${env.key} to ${target}...`);
      execSync(`npx vercel env add ${env.key} ${target}`, {
        input: env.value + "\n",
        stdio: ["pipe", "inherit", "inherit"]
      });
    } catch {
      console.log(`Note: ${env.key} might already exist in ${target}, skipping or check Vercel dashboard.`);
    }
  }
}

console.log("\nAll environment variables processed!");
