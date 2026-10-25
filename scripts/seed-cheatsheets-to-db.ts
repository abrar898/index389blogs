import { PrismaClient } from "@prisma/client";
import { CHEATSHEETS } from "../src/data/cheatsheets";

const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({
  datasourceUrl: dbUrl,
});

async function main() {
  console.log("Seeding HackIndex-inspired Cheatsheets into Supabase Database...\n");

  let author = await prisma.user.findFirst({
    where: {
      OR: [
        { role: "ADMIN" },
        { name: "Arax0n" },
        { email: "admin@index389.com" },
      ],
    },
  });

  if (!author) {
    author = await prisma.user.findFirst();
  }

  if (!author) {
    throw new Error("No user found in database to assign cheatsheets to.");
  }

  for (const cs of CHEATSHEETS) {
    const slug = `cheatsheet-${cs.id}`;
    let markdown = `# ${cs.title}\n\n`;
    markdown += `**Protocol:** \`${cs.protocol}\` | **Category:** \`${cs.category}\`\n\n`;
    markdown += `> ${cs.summary}\n\n---\n\n`;

    const phases = ["recon", "enumeration", "exploitation", "privesc"] as const;
    for (const p of phases) {
      const cmds = cs.phases[p];
      if (!cmds || cmds.length === 0) continue;
      const phaseName =
        p === "recon"
          ? "Reconnaissance"
          : p === "enumeration"
          ? "Enumeration"
          : p === "exploitation"
          ? "Exploitation"
          : "Privilege Escalation";

      markdown += `## ${phaseName}\n\n`;
      for (const cmd of cmds) {
        markdown += `### ${cmd.label}\n\n${cmd.description}\n\n\`\`\`bash\n${cmd.command}\n\`\`\`\n\n`;
      }
    }

    console.log(`Upserting Knowledge Document: [${cs.title}] (${slug})...`);
    await prisma.knowledgeDocument.upsert({
      where: { slug },
      update: {
        title: `${cs.title} (Pentest Cheatsheet)`,
        folder: cs.category,
        category: "Cheatsheet",
        content: markdown,
        visibility: "PUBLIC",
        isFavorite: true,
      },
      create: {
        title: `${cs.title} (Pentest Cheatsheet)`,
        slug,
        folder: cs.category,
        category: "Cheatsheet",
        content: markdown,
        visibility: "PUBLIC",
        isFavorite: true,
        authorId: author.id,
      },
    });
  }

  console.log("\n✓ All HackIndex Cheatsheets successfully seeded into Supabase!");
}

main()
  .catch((e) => {
    console.error("Error seeding cheatsheets:", e.message || e);
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch {}
  });
