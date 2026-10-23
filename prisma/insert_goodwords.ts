import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Adding GoodWords writeup verbatim to the database...");

  // 1. Author
  let author = await prisma.user.findUnique({
    where: { email: "abrarjr66@cybervault.local" },
  });

  if (!author) {
    author = await prisma.user.findFirst({
      where: { role: { in: ["AUTHOR", "ADMIN"] } },
    });
  }

  if (!author) {
    throw new Error("No author user found in database");
  }

  // 2. Category
  let category = await prisma.category.findUnique({
    where: { slug: "hackthebox-writeups" },
  });

  // 3. Tags
  const tags = await prisma.tag.findMany({
    where: {
      slug: {
        in: ["hack-the-box", "web-security", "cve"],
      },
    },
  });

  // 4. Exact Content
  const contentDir = path.join(__dirname, "..", "content", "writeups");
  const goodwordsContent = fs.readFileSync(path.join(contentDir, "goodwords.md"), "utf-8");

  const item = {
    title: "HTB GoodWords Challenges — Complete Writeup",
    slug: "hackthebox-goodwords-challenges",
    platform: "HACKTHEBOX",
    machineName: "GoodWords",
    difficulty: "EASY",
    os: "LINUX",
    skillsRequired: "API Interaction, Machine Learning Fundamentals, Naive Bayes Classifier Analysis, Python Scripting",
    skillsLearned: "GoodWords Attack, Feature Obfuscation, Adversarial Machine Learning, Model Weight Inspection with Scikit-Learn",
    overview: "Both challenges are based on Naive Bayes classifier poisoning, also called a GoodWords attack or Feature Obfuscation Attack. The goal is to fool a text classifier by appending carefully chosen words to a message — without changing the original text — so the model flips its prediction label.",
    content: goodwordsContent,
    readingTimeMinutes: 10,
  };

  console.log(`Upserting WriteUp: ${item.title}...`);

  await prisma.writeUp.upsert({
    where: { slug: item.slug },
    update: {
      title: item.title,
      platform: item.platform,
      machineName: item.machineName,
      difficulty: item.difficulty,
      os: item.os,
      skillsRequired: item.skillsRequired,
      skillsLearned: item.skillsLearned,
      overview: item.overview,
      content: item.content,
      authorId: author.id,
      status: "PUBLISHED",
      isFeatured: true,
      publishedAt: new Date(),
    },
    create: {
      title: item.title,
      slug: item.slug,
      platform: item.platform,
      machineName: item.machineName,
      difficulty: item.difficulty,
      os: item.os,
      skillsRequired: item.skillsRequired,
      skillsLearned: item.skillsLearned,
      overview: item.overview,
      content: item.content,
      authorId: author.id,
      status: "PUBLISHED",
      isFeatured: true,
      publishedAt: new Date(),
    },
  });

  console.log(`Upserting Article: ${item.title}...`);

  const article = await prisma.article.upsert({
    where: { slug: item.slug },
    update: {
      title: item.title,
      subtitle: `AI & Machine Learning Adversarial Attacks: ${item.machineName} (${item.platform})`,
      summary: item.overview,
      content: item.content,
      authorId: author.id,
      categoryId: category?.id,
      status: "PUBLISHED",
      visibility: "PUBLIC",
      isFeatured: true,
      readingTimeMinutes: item.readingTimeMinutes,
      publishedAt: new Date(),
    },
    create: {
      title: item.title,
      slug: item.slug,
      subtitle: `AI & Machine Learning Adversarial Attacks: ${item.machineName} (${item.platform})`,
      summary: item.overview,
      content: item.content,
      authorId: author.id,
      categoryId: category?.id,
      status: "PUBLISHED",
      visibility: "PUBLIC",
      isFeatured: true,
      readingTimeMinutes: item.readingTimeMinutes,
      publishedAt: new Date(),
    },
  });

  for (const tag of tags) {
    await prisma.articleTag.upsert({
      where: {
        articleId_tagId: {
          articleId: article.id,
          tagId: tag.id,
        },
      },
      update: {},
      create: {
        articleId: article.id,
        tagId: tag.id,
      },
    });
  }

  console.log(`[SUCCESS] Inserted: ${item.title} (Slug: ${item.slug}) with ${item.content.length} characters.`);
}

main()
  .catch((e) => {
    console.error("Error inserting GoodWords writeup:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
