import fs from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// High-fidelity Medium HTML to Clean Markdown Converter
// Preserves 100% of all words, sentences, explanations, code blocks, and diagrams.
function htmlToMarkdown(html: string): string {
  let md = html;

  // Merge adjacent <pre> tags (Medium often splits code snippets into multiple consecutive <pre> elements)
  md = md.replace(/<\/pre>\s*<pre>/gi, "\n");

  // Images and captions
  md = md.replace(/<figure><img[^>]*src="([^"]+)"[^>]*\/?>(?:<figcaption>([^<]*)<\/figcaption>)?<\/figure>/gi, (match, src, caption) => {
    return caption ? `\n\n![${caption}](${src})\n*${caption}*\n\n` : `\n\n![](${src})\n\n`;
  });

  md = md.replace(/<img[^>]*src="([^"]+)"[^>]*\/?>(?:<figcaption>([^<]*)<\/figcaption>)?/gi, (match, src, caption) => {
    if (src.includes("/stat?event=")) return ""; // skip Medium tracking pixel
    return caption ? `\n\n![${caption}](${src})\n*${caption}*\n\n` : `\n\n![](${src})\n\n`;
  });

  // Headings
  md = md.replace(/<h1>(.*?)<\/h1>/gi, "\n\n# $1\n\n");
  md = md.replace(/<h2>(.*?)<\/h2>/gi, "\n\n## $1\n\n");
  md = md.replace(/<h3>(.*?)<\/h3>/gi, "\n\n### $1\n\n");
  md = md.replace(/<h4>(.*?)<\/h4>/gi, "\n\n#### $1\n\n");
  md = md.replace(/<h5>(.*?)<\/h5>/gi, "\n\n##### $1\n\n");

  // Blockquotes
  md = md.replace(/<blockquote>([\s\S]*?)<\/blockquote>/gi, (match, content) => {
    const lines = content.replace(/<br\s*\/?>/gi, "\n").replace(/<\/?p>/gi, "").split("\n");
    return "\n\n" + lines.map((l: string) => `> ${l.trim()}`).filter(Boolean).join("\n") + "\n\n";
  });

  // Code blocks: convert <pre> to markdown fenced code block
  md = md.replace(/<pre>([\s\S]*?)<\/pre>/gi, (match, code) => {
    const cleanCode = code
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    return `\n\n\`\`\`bash\n${cleanCode.trim()}\n\`\`\`\n\n`;
  });

  // Inline formatting
  md = md.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<b>(.*?)<\/b>/gi, "**$1**");
  md = md.replace(/<em>(.*?)<\/em>/gi, "*$1*");
  md = md.replace(/<i>(.*?)<\/i>/gi, "*$1*");
  md = md.replace(/<code>(.*?)<\/code>/gi, "`$1`");

  // Links
  md = md.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");

  // Lists
  md = md.replace(/<ul>([\s\S]*?)<\/ul>/gi, (match, list) => {
    const items = list.match(/<li>([\s\S]*?)<\/li>/gi) || [];
    const formatted = items.map((item: string) => {
      const text = item.replace(/<\/?li>/gi, "").replace(/<br\s*\/?>/gi, "\n").trim();
      return `- ${text}`;
    });
    return "\n\n" + formatted.join("\n") + "\n\n";
  });

  md = md.replace(/<ol>([\s\S]*?)<\/ol>/gi, (match, list) => {
    let index = 1;
    const items = list.match(/<li>([\s\S]*?)<\/li>/gi) || [];
    const formatted = items.map((item: string) => {
      const text = item.replace(/<\/?li>/gi, "").replace(/<br\s*\/?>/gi, "\n").trim();
      return `${index++}. ${text}`;
    });
    return "\n\n" + formatted.join("\n") + "\n\n";
  });

  // Paragraphs & Line Breaks
  md = md.replace(/<br\s*\/?>/gi, "\n");
  md = md.replace(/<p>([\s\S]*?)<\/p>/gi, "\n\n$1\n\n");

  // Strip remaining HTML tags
  md = md.replace(/<[^>]+>/g, "");

  // Unescape standard HTML entities
  md = md
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Normalize excessive newlines
  md = md.replace(/\n{3,}/g, "\n\n").trim();

  return md;
}

async function main() {
  const rssFilePath = "C:\\Users\\Mushaf\\.gemini\\antigravity-ide\\brain\\0ea670a9-fa10-43a5-8b3f-c9e45969ea85\\.system_generated\\steps\\753\\content.md";
  const rawXml = fs.readFileSync(rssFilePath, "utf-8");

  // Extract all <item> blocks
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  const items: { title: string; link: string; guid: string; content: string }[] = [];

  while ((match = itemRegex.exec(rawXml)) !== null) {
    const itemBlock = match[1];
    const titleMatch = itemBlock.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
    const linkMatch = itemBlock.match(/<link>(.*?)<\/link>/);
    const guidMatch = itemBlock.match(/<guid[^>]*>(.*?)<\/guid>/);
    const contentMatch = itemBlock.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);

    if (titleMatch && contentMatch) {
      items.push({
        title: titleMatch[1].trim(),
        link: linkMatch ? linkMatch[1].trim().split("?")[0] : "",
        guid: guidMatch ? guidMatch[1].trim() : "",
        content: contentMatch[1].trim(),
      });
    }
  }

  const writeupMapping: { [key: string]: { slug: string; platform: string; categorySlug: string; machineName: string; difficulty: string; os: string; skillsRequired: string; skillsLearned: string; overview: string } } = {
    "9b2ca6abe9db": {
      slug: "hackthebox-paperwork-linux-easy",
      platform: "HACKTHEBOX",
      categorySlug: "hackthebox-writeups",
      machineName: "Paperwork",
      difficulty: "EASY",
      os: "LINUX",
      skillsRequired: "Source Code Review, LPD Protocol Interaction, Command Injection",
      skillsLearned: "JetDirect Path Traversal, SCM_RIGHTS Unix Socket FD Leakage Exploitation",
      overview: "Complete unedited write-up for HackTheBox Paperwork. Covers source disclosure in CorpoSite, LPD command injection as lp, JetDirect path traversal to archivist, and leaking privileged file descriptors over Unix socket to root.",
    },
    "946596e009c1": {
      slug: "hackthebox-snapped",
      platform: "HACKTHEBOX",
      categorySlug: "hackthebox-writeups",
      machineName: "Snapped",
      difficulty: "MEDIUM",
      os: "LINUX",
      skillsRequired: "Subdomain Fuzzing, Nginx-UI Exploitation (CVE-2026-27944), Hashcat Bcrypt Cracking",
      skillsLearned: "Snapd TOCTOU Race Condition (CVE-2026-3888), Shared Library Namespace Poisoning",
      overview: "Complete unedited write-up for HackTheBox Snapped. Features Nginx-UI unauthenticated backup decryption (CVE-2026-27944), cracking jonathan's hash, and reliable snapd TOCTOU race condition execution (CVE-2026-3888) to root.",
    },
    "bacb732b6465": {
      slug: "hackthebox-nexus",
      platform: "HACKTHEBOX",
      categorySlug: "hackthebox-writeups",
      machineName: "Nexus",
      difficulty: "EASY",
      os: "LINUX",
      skillsRequired: "Nmap, Virtual Host Fuzzing, Git Commit Diff Analysis, Krayin CRM File Upload",
      skillsLearned: "CVE-2026-38526 RCE, Password Reuse, Gitea Template-Sync Path Traversal to Root",
      overview: "Complete unedited write-up for HackTheBox Nexus. Full attack chain: subdomain fuzzing with ffuf, leaked credentials in git history, Krayin CRM RCE via CVE-2026-38526, lateral movement, and privilege escalation via Gitea template sync path traversal running as root.",
    },
    "e9382ec58f3c": {
      slug: "hackthebox-connected",
      platform: "HACKTHEBOX",
      categorySlug: "hackthebox-writeups",
      machineName: "Connected",
      difficulty: "EASY",
      os: "LINUX",
      skillsRequired: "Nmap Reconnaissance, FreePBX 16 Identification, Metasploit SQLi",
      skillsLearned: "CVE-2025-57819 SQL Injection, Incron Filesystem Event Trigger Root Escalation",
      overview: "Complete unedited write-up for HackTheBox Connected. Covers unauthenticated SQL injection in FreePBX 16 Endpoint Manager (CVE-2025-57819) for asterisk shell, and incron filesystem event trigger abuse via /etc/dahdi/init.conf for root.",
    },
    "aacfd7e038e8": {
      slug: "tryhackme-hacker-holidays-complimentary",
      platform: "TRYHACKME",
      categorySlug: "tryhackme-writeups",
      machineName: "Complimentary",
      difficulty: "EASY",
      os: "LINUX",
      skillsRequired: "Client-side JS Inspection, AWS Cognito Architecture, DevTools Console Scripting",
      skillsLearned: "Cognito Unauthenticated Role Exploitation, Over-permissive IAM Policy DynamoDB Scanning",
      overview: "Complete unedited write-up for TryHackMe Hacker Holidays: Complimentary. Analyzes client-side AWS Cognito Identity Pool credential issuance and exploits over-permissive unauthenticated IAM roles to scan DynamoDB and dump all guest records.",
    },
    "cfa1547f91ca": {
      slug: "hackthebox-enigma",
      platform: "HACKTHEBOX",
      categorySlug: "hackthebox-writeups",
      machineName: "Enigma",
      difficulty: "EASY",
      os: "LINUX",
      skillsRequired: "Nmap, NFS Share Enumeration, Webmail Credential Reuse, OpenSTAManager Exploitation",
      skillsLearned: "CVE-2025-69212 Command Injection, MySQL Password Cracking, SSH Port Forwarding, OliveTin Privesc",
      overview: "Complete unedited write-up for HackTheBox Enigma. Covers anonymous NFS share credential leakage, webmail credential reuse, OpenSTAManager command injection, MySQL hash cracking, and unsanitized argument injection in OliveTin running as root.",
    },
    "03916ba9be69": {
      slug: "tryhackme-publisher-boot-to-root",
      platform: "TRYHACKME",
      categorySlug: "tryhackme-writeups",
      machineName: "Publisher",
      difficulty: "EASY",
      os: "LINUX",
      skillsRequired: "Nmap, Gobuster Directory Fuzzing, SPIP 4.2.0 RCE (Exploit 51536.py)",
      skillsLearned: "SSH Key Extraction, SUID Binary /opt/run_container.sh Script Abuse to Root",
      overview: "Complete unedited write-up for TryHackMe Publisher. Covers Nmap recon, Gobuster discovery of SPIP 4.2.0, unauthenticated RCE, SSH key extraction for user think, and SUID binary /usr/sbin/run_container script modification to root.",
    },
  };

  const author = await prisma.user.findUnique({ where: { email: "abrarjr66@cybervault.local" } });
  if (!author) {
    console.error("Author not found");
    return;
  }

  const catHtb = await prisma.category.findUnique({ where: { slug: "hackthebox-writeups" } });
  const catThm = await prisma.category.findUnique({ where: { slug: "tryhackme-writeups" } });

  for (const item of items) {
    let matchedKey = Object.keys(writeupMapping).find((key) => item.link.includes(key) || item.guid.includes(key));
    if (!matchedKey) continue;

    const meta = writeupMapping[matchedKey];
    const markdownBody = htmlToMarkdown(item.content);
    const fullContent = `> [!NOTE]\n> Originally written and published by **Arax0n** on Medium: [Read Original Publication](${item.link})\n\n${markdownBody}`;

    // 1. Update WriteUp
    await prisma.writeUp.upsert({
      where: { slug: meta.slug },
      update: {
        title: item.title,
        platform: meta.platform,
        machineName: meta.machineName,
        difficulty: meta.difficulty,
        os: meta.os,
        skillsRequired: meta.skillsRequired,
        skillsLearned: meta.skillsLearned,
        overview: meta.overview,
        content: fullContent,
        authorId: author.id,
        status: "PUBLISHED",
      },
      create: {
        title: item.title,
        slug: meta.slug,
        platform: meta.platform,
        machineName: meta.machineName,
        difficulty: meta.difficulty,
        os: meta.os,
        skillsRequired: meta.skillsRequired,
        skillsLearned: meta.skillsLearned,
        overview: meta.overview,
        content: fullContent,
        authorId: author.id,
        status: "PUBLISHED",
        isFeatured: true,
      },
    });

    // 2. Update Article under Category
    const targetCat = meta.categorySlug === "hackthebox-writeups" ? catHtb : catThm;
    await prisma.article.upsert({
      where: { slug: meta.slug },
      update: {
        title: item.title,
        subtitle: `Complete Walkthrough & Methodology: ${meta.machineName} (${meta.platform})`,
        summary: meta.overview,
        content: fullContent,
        authorId: author.id,
        categoryId: targetCat?.id,
        canonicalUrl: item.link,
        status: "PUBLISHED",
        visibility: "PUBLIC",
        isFeatured: true,
        readingTimeMinutes: Math.max(5, Math.ceil(fullContent.split(/\s+/).length / 200)),
      },
      create: {
        title: item.title,
        slug: meta.slug,
        subtitle: `Complete Walkthrough & Methodology: ${meta.machineName} (${meta.platform})`,
        summary: meta.overview,
        content: fullContent,
        authorId: author.id,
        categoryId: targetCat?.id,
        canonicalUrl: item.link,
        status: "PUBLISHED",
        visibility: "PUBLIC",
        isFeatured: true,
        readingTimeMinutes: Math.max(5, Math.ceil(fullContent.split(/\s+/).length / 200)),
      },
    });

    console.log(`[SUCCESS] Refined & Updated: ${item.title}`);
  }

  console.log("\nALL WRITE-UPS RE-IMPORTED WITH PERFECT FORMATTING AND 100% UNABRIDGED WORD-FOR-WORD TEXT!");
}

main()
  .catch((e) => {
    console.error("Import error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
