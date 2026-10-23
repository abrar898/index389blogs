import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Adding the 3 HackTheBox writeups verbatim to the database...");

  // 1. Find author
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

  console.log(`Using Author: ${author.name} (${author.email})`);

  // 2. Find Category for Hack The Box Write-ups
  let category = await prisma.category.findUnique({
    where: { slug: "hackthebox-writeups" },
  });

  if (!category) {
    category = await prisma.category.findFirst({
      where: { slug: { in: ["write-ups", "lab-writeups"] } },
    });
  }

  // 3. Find tags
  const tags = await prisma.tag.findMany({
    where: {
      slug: {
        in: ["hack-the-box", "linux", "privilege-escalation", "web-security", "cve"],
      },
    },
  });

  // 4. Load Markdown content verbatim from disk
  const contentDir = path.join(__dirname, "..", "content", "writeups");
  const makeSenseContent = fs.readFileSync(path.join(contentDir, "makesense.md"), "utf-8");
  const cohortContent = fs.readFileSync(path.join(contentDir, "cohort.md"), "utf-8");
  const bedsideContent = fs.readFileSync(path.join(contentDir, "bedside.md"), "utf-8");

  const writeupsToInsert = [
    {
      title: "MakeSense — HackTheBox Writeup",
      slug: "hackthebox-makesense",
      platform: "HACKTHEBOX",
      machineName: "MakeSense",
      difficulty: "MEDIUM",
      os: "LINUX",
      skillsRequired: "Nmap Reconnaissance, WordPress 7.0 Enumeration, JavaScript Source Code Review, AES-GCM Cryptographic Analysis",
      skillsLearned: "Stored XSS via Encrypted Payloads, WordPress Admin Account Creation via XSS, Plugin Upload RCE, Credential Reuse, Root OCR PHP Webshell Exploitation",
      overview: "MakeSense is a medium-difficulty Linux box running a custom WordPress 7.0 installation with an AI-powered voice transcription feature. The attack chain involves: enumerating custom JS, extracting a hardcoded AES key, Stored XSS via forged encrypted payloads to create an admin user, malicious plugin upload to gain a shell as www-data, credential reuse to walter, and abusing an internal root-run OCR PHP service to achieve root.",
      content: makeSenseContent,
      readingTimeMinutes: 12,
    },
    {
      title: 'HTB "Cohort" — Detailed Writeup',
      slug: "hackthebox-cohort",
      platform: "HACKTHEBOX",
      machineName: "Cohort",
      difficulty: "MEDIUM",
      os: "LINUX",
      skillsRequired: "SSRF Filter Bypass, Virtual Host Fuzzing, WebSocket Protocol Exploitation, Linux Privilege Escalation",
      skillsLearned: "CVE-2026-39987 (Marimo Unauth Terminal WebSocket PTY), Session Detach Reverse Shell, CVE-2026-41651 (PackageKit D-Bus TOCTOU Race Condition to SUID Root)",
      overview: "Cohort chains a web-layer SSRF with two real 2026 CVEs: loopback filter bypass in /api/validate to discover hidden marimo notebook vhost, CVE-2026-39987 unauthenticated WebSocket PTY endpoint for initial RCE, and CVE-2026-41651 ('Pack2TheRoot') PackageKit TOCTOU race for root.",
      content: cohortContent,
      readingTimeMinutes: 14,
    },
    {
      title: "Bedside — HackTheBox Writeup",
      slug: "hackthebox-bedside",
      platform: "HACKTHEBOX",
      machineName: "Bedside",
      difficulty: "MEDIUM",
      os: "LINUX",
      skillsRequired: "Virtual Host Fuzzing, PDF Structure Analysis, Python Pickle Deserialization, Internal Port Scanning via /dev/tcp, LFI",
      skillsLearned: "CVE-2025-64512 (pdfminer.six CMap Path Traversal to Pickle Deserialization RCE), TTY Stabilization, PyTorch weights_only=False Arbitrary Object Deserialization Root Privesc",
      overview: "Comprehensive boot-to-root walkthrough for Bedside on HackTheBox. Features virtual host discovery for research.bedside.htb, identifying pdfminer.six and exploiting CVE-2025-64512 via a crafted PDF and malicious pickle payload to gain foothold as datawrangler, bash /dev/tcp port scanning to find an internal web service, LFI to steal developer's SSH key, and exploiting unsafe PyTorch torch.load(weights_only=False) deserialization in a root-run trainer to gain root.",
      content: bedsideContent,
      readingTimeMinutes: 18,
    },
  ];

  for (const item of writeupsToInsert) {
    console.log(`Upserting WriteUp: ${item.title}...`);

    // Upsert WriteUp table
    const writeUp = await prisma.writeUp.upsert({
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

    // Upsert Article table
    const article = await prisma.article.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        subtitle: `Complete Walkthrough & Exploitation Methodology: ${item.machineName} (${item.platform})`,
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
        subtitle: `Complete Walkthrough & Exploitation Methodology: ${item.machineName} (${item.platform})`,
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

    // Connect tags to the article
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

    console.log(`[SUCCESS] Inserted: ${item.title} (Slug: ${item.slug})`);
  }

  console.log("\nAll 3 writeups have been inserted into the database with 100% exact verbatim content!");
}

main()
  .catch((e) => {
    console.error("Error inserting writeups:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
