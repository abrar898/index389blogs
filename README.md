# CyberVault — Advanced Cybersecurity Research, Knowledge Base & Community Platform

A production-ready, high-performance cybersecurity publishing and community platform built with **Next.js 16 (App Router)**, **TypeScript (Strict Mode)**, **Tailwind CSS**, **Prisma ORM**, **Jose JWT Authentication**, **Unified / Marked**, and genuine **DOCX & PDF document exporters**.

Designed for independent security researchers, red team operators, and blue team defenders.

---

## 🛡️ Key Features

### 1. Dual Publishing Model
- **Personal Publishing**: Write, edit, organize, and publish technical security research, CVE dissections, and lab write-ups.
- **Community Publishing**: Registered operators can submit peer reviews, comment on analyses, and participate in technical discussions with server-enforced role-based moderation.

### 2. Core Security Content Architecture
- **Vulnerability & CVE Tracker** (`/vulnerabilities`): Structured CVE records with CVSS v3.1/v4.0 base scores and vector strings, affected software scope, CISA KEV real-world exploitation indicators, and detection logic (Snort / Suricata / Sigma).
- **Technical Articles & Research Papers** (`/articles`, `/research`): Markdown-first technical papers with frontmatter parsing, interactive Table of Contents (TOC), GitHub-style callouts (`[!NOTE]`, `[!WARNING]`, `[!TIP]`, etc.), and syntax-highlighted code blocks with one-click copy buttons.
- **Offensive Lab Write-ups** (`/writeups`): Hack The Box, TryHackMe, and CTF walkthroughs with machine difficulty ratings, required skills, and lessons learned.
- **Knowledge Base & Private Notes** (`/knowledge`): Modular reference docs and cheat sheets with private note isolation (private notes are strictly hidden from public discovery and search).
- **Community Discussions** (`/community`): Structured technical debate threads organized by Career, Defensive, Offensive, and Research categories.

### 3. Document Exports
- **Genuine DOCX Word Export**: Generates editable Microsoft Word `.docx` documents via `/api/export/docx?slug=[slug]` preserving headings, paragraphs, lists, callout quotes, and code blocks.
- **Print-friendly PDF Export**: High-contrast, clean printable layout via `/articles/[slug]/print` ready for browser PDF export.

### 4. Enterprise Security & RBAC
- **Server-Side Role-Based Access Control**:
  - `ADMIN`: Full platform control, operator role promotion, site audits.
  - `EDITOR`: Review submissions, publish approved articles, manage metadata.
  - `AUTHOR`: Create and draft original content, maintain private notes.
  - `READER`: Read public research, post comments, join discussions.
  - `MODERATOR`: Review reports and moderate community discourse.
- **XSS Sanitization**: HTML sanitized with `sanitize-html` to eliminate script execution and dangerous attributes.
- **Zero-Tracking Privacy**: HTTP-only, secure, SameSite JWT session cookies without third-party tracking beacons.
- **Audit Logging**: Sensitive publishing, role modification, and login events are tracked in the database audit log.

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js**: v20+ (tested on Node v24.19.0)
- **npm**: v10+

### 1. Clone & Install Dependencies
```bash
cd blogs_index389
npm install
```

### 2. Initialize Database & Seed Content
Local development uses a zero-config SQLite database (`dev.db`). Pre-seeded content includes admin and author accounts, sample articles, CVE-2026-1001, HTB write-up, cheat sheets, and discussions:

```bash
# Push schema to SQLite database
npm run db:push

# Seed demo data and operator credentials
npm run db:seed
```

### 3. Run Automated Test Suite
```bash
npm test
```
Runs 13 automated tests verifying:
- Password security and bcrypt hashing
- JWT session creation and tampering validation
- Server-side RBAC permissions and publication guards
- Markdown parsing, Table of Contents, and Callout processing
- XSS and malicious vector sanitization
- Slug generation and collision handling
- Genuine DOCX document generation

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or the port indicated in terminal) in your browser.

---

## 🔑 Pre-seeded Operator Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@cybervault.local` | `AdminCyberVault2026!` | Full platform administration, user role management, publication controls |
| **AUTHOR** | `author@cybervault.local` | `AuthorCyberVault2026!` | Article drafting, Markdown import, private note authoring |

---

## 🗄️ Database Architecture

The platform uses Prisma ORM with 22 structured models:
- `User` & `UserProfile`: Authentication, session metadata, social links.
- `Article`, `ArticleRevision`, `Category`, `Tag`, `ArticleTag`: CMS content with version history.
- `CVERecord` & `VulnerabilityReference`: Vulnerability repository and external advisories.
- `WriteUp`: Lab walkthroughs (HTB, TryHackMe, CTF) with platform and difficulty metadata.
- `KnowledgeDocument`: Personal notes and tactical cheat sheets with visibility boundaries.
- `Comment`, `Discussion`, `DiscussionReply`, `Report`: Community interactions and moderation.
- `NewsletterSubscriber`: Consent-based email subscription management.
- `AuditLog`: Security audit trails for all sensitive operations.

### Production PostgreSQL Configuration
To deploy against a managed PostgreSQL instance:
1. Update `datasource db` in [prisma/schema.prisma](prisma/schema.prisma):
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/cybervault?schema=public"
   ```
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

---

## 🔍 Technical SEO & Discoverability
- **Dynamic XML Sitemap**: Generated automatically at `/sitemap.xml` indexing only verified public content.
- **Robots Policy**: Served at `/robots.txt` disallowing private administrative and dashboard routes.
- **Dynamic RSS 2.0 Feed**: Live feed available at `/api/rss`.
- **OpenGraph & Metadata**: Descriptive OpenGraph and Twitter cards configured on all public routes.
