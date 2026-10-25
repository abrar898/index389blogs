import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Renaming author names to 'Arax0n' in the Supabase database...\n");

  // 1. Update User records
  const users = await prisma.user.findMany();
  for (const user of users) {
    const lowerName = user.name.toLowerCase();
    const lowerEmail = user.email.toLowerCase();
    if (
      lowerName.includes("abrar") ||
      lowerName.includes("levi") ||
      lowerEmail.includes("abrar") ||
      lowerEmail.includes("levi")
    ) {
      console.log(`Updating User: [${user.name}] (${user.email}) -> "Arax0n"`);
      await prisma.user.update({
        where: { id: user.id },
        data: { name: "Arax0n" },
      });
    }
  }

  // 2. Update Writeups content
  const writeups = await prisma.writeUp.findMany();
  for (const w of writeups) {
    let newContent = w.content
      .replace(/\*\*Abrar\s*\(abrarjr66\)\*\*/gi, "**Arax0n**")
      .replace(/Abrar\s*\(abrarjr66\)/gi, "Arax0n")
      .replace(/Writeup by LEvi/gi, "Writeup by Arax0n")
      .replace(/by LEvi/gi, "by Arax0n");

    let newOverview = w.overview
      ? w.overview
          .replace(/Abrar\s*\(abrarjr66\)/gi, "Arax0n")
          .replace(/Abrar/gi, "Arax0n")
          .replace(/LEvi/gi, "Arax0n")
      : w.overview;

    if (newContent !== w.content || newOverview !== w.overview) {
      console.log(`Updating Writeup text for: "${w.title}"`);
      await prisma.writeUp.update({
        where: { id: w.id },
        data: {
          content: newContent,
          overview: newOverview,
        },
      });
    }
  }

  // 3. Update Articles content
  const articles = await prisma.article.findMany();
  for (const a of articles) {
    let newContent = a.content
      .replace(/\*\*Abrar\s*\(abrarjr66\)\*\*/gi, "**Arax0n**")
      .replace(/Abrar\s*\(abrarjr66\)/gi, "Arax0n")
      .replace(/Writeup by LEvi/gi, "Writeup by Arax0n")
      .replace(/by LEvi/gi, "by Arax0n");

    if (newContent !== a.content) {
      console.log(`Updating Article text for: "${a.title}"`);
      await prisma.article.update({
        where: { id: a.id },
        data: { content: newContent },
      });
    }
  }

  console.log("\n✓ All author records and content references have been changed to 'Arax0n'!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
