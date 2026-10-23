import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";
import { createSessionToken, verifySessionToken } from "../src/lib/auth/session";
import {
  isAdmin,
  isEditor,
  isAuthor,
  isModerator,
  canPublishContent,
  canEditArticle,
} from "../src/lib/permissions/rbac";
import {
  parseMarkdown,
  slugify,
  calculateReadingTime,
} from "../src/lib/markdown/renderer";
import { generateArticleDocx } from "../src/lib/exports/docx-generator";

describe("CyberVault Security Platform Test Suite", () => {
  describe("1. Password Security & Hashing", () => {
    it("should hash passwords securely and verify match correctly", async () => {
      const rawPassword = "CorrectHorseBatteryStaple2026!";
      const hash = await hashPassword(rawPassword);

      assert.notEqual(hash, rawPassword);
      assert.ok(hash.startsWith("$2"));

      const isMatch = await verifyPassword(rawPassword, hash);
      assert.equal(isMatch, true);

      const isWrongMatch = await verifyPassword("WrongPassword123", hash);
      assert.equal(isWrongMatch, false);
    });
  });

  describe("2. JWT Session & Token Management", () => {
    it("should create valid signed session tokens and verify payload", async () => {
      const user = {
        id: "usr_test123",
        email: "secops@cybervault.local",
        name: "Test Operator",
        role: "ADMIN" as const,
        status: "ACTIVE",
      };

      const token = await createSessionToken(user);
      assert.ok(typeof token === "string");
      assert.ok(token.length > 50);

      const verified = await verifySessionToken(token);
      assert.ok(verified !== null);
      assert.equal(verified?.id, user.id);
      assert.equal(verified?.email, user.email);
      assert.equal(verified?.role, "ADMIN");
    });

    it("should return null for tampered or invalid tokens", async () => {
      const invalid = await verifySessionToken("invalid.tampered.token");
      assert.equal(invalid, null);
    });
  });

  describe("3. Role-Based Access Control (RBAC)", () => {
    const adminUser = { id: "1", email: "a@cv.local", name: "A", role: "ADMIN" as const, status: "ACTIVE" };
    const editorUser = { id: "2", email: "e@cv.local", name: "E", role: "EDITOR" as const, status: "ACTIVE" };
    const authorUser = { id: "3", email: "au@cv.local", name: "Au", role: "AUTHOR" as const, status: "ACTIVE" };
    const readerUser = { id: "4", email: "r@cv.local", name: "R", role: "READER" as const, status: "ACTIVE" };

    it("should correctly validate Admin permissions", () => {
      assert.equal(isAdmin(adminUser), true);
      assert.equal(isAdmin(editorUser), false);
      assert.equal(isAdmin(readerUser), false);
    });

    it("should correctly validate Editor permissions", () => {
      assert.equal(isEditor(adminUser), true);
      assert.equal(isEditor(editorUser), true);
      assert.equal(isEditor(authorUser), false);
    });

    it("should allow Authors to edit only their own articles", () => {
      assert.equal(canEditArticle(authorUser, "3"), true);
      assert.equal(canEditArticle(authorUser, "99"), false);
      // Admin can edit any article
      assert.equal(canEditArticle(adminUser, "99"), true);
      // Reader cannot edit articles
      assert.equal(canEditArticle(readerUser, "4"), false);
    });

    it("should allow only Admins and Editors to publish directly", () => {
      assert.equal(canPublishContent(adminUser), true);
      assert.equal(canPublishContent(editorUser), true);
      assert.equal(canPublishContent(authorUser), false);
      assert.equal(canPublishContent(readerUser), false);
    });
  });

  describe("4. Markdown Parser, TOC, & Frontmatter", () => {
    it("should extract frontmatter metadata and generate clean table of contents", () => {
      const rawMarkdown = `---
title: Understanding Linux Kernel Namespaces
category: Offensive Security
tags: [linux, containers]
---

# Introduction

Overview of namespace isolation.

## User Namespaces

User namespaces map UID ranges.

### Exploitation Prerequisites

Requires unprivileged user namespace activation.
`;

      const result = parseMarkdown(rawMarkdown);
      assert.equal(result.data.title, "Understanding Linux Kernel Namespaces");
      assert.equal(result.data.category, "Offensive Security");

      // Verify Table of Contents
      assert.equal(result.toc.length, 3);
      assert.equal(result.toc[0].text, "Introduction");
      assert.equal(result.toc[0].level, 1);
      assert.equal(result.toc[1].text, "User Namespaces");
      assert.equal(result.toc[1].level, 2);
      assert.equal(result.toc[2].text, "Exploitation Prerequisites");
      assert.equal(result.toc[2].level, 3);
    });

    it("should transform GitHub alert callouts into rich container markup", () => {
      const input = `> [!NOTE]\n> Ensure you test this in an isolated lab.\n\n> [!WARNING]\n> Never execute against unauthorized hosts.`;
      const result = parseMarkdown(input);

      assert.ok(result.html.includes("callout-note"));
      assert.ok(result.html.includes("callout-warning"));
      assert.ok(result.html.includes("NOTE"));
      assert.ok(result.html.includes("WARNING"));
    });

    it("should calculate reading time accurately", () => {
      const shortText = "Word ".repeat(400); // 400 words ~ 2 mins at 200wpm
      const time = calculateReadingTime(shortText);
      assert.equal(time, 2);
    });

    it("should sanitize dangerous script and XSS vectors from markdown", () => {
      const malicious = `# Header\n\n<script>alert("XSS Attack")</script>\n<img src="x" onerror="alert(1)">\n[Harmful Link](javascript:alert(1))`;
      const result = parseMarkdown(malicious);

      assert.equal(result.html.includes("<script>"), false);
      assert.equal(result.html.includes("onerror"), false);
      assert.equal(result.html.includes("href=\"javascript:"), false);
    });
  });

  describe("5. Slug Generation & String Utilities", () => {
    it("should generate clean URL-safe slugs", () => {
      assert.equal(
        slugify("CVE-2026-1001: Remote Code Execution & Heap Overflow!"),
        "cve-2026-1001-remote-code-execution-heap-overflow"
      );
      assert.equal(
        slugify("Active Directory: Kerberoasting & AS-REP Roasting (2026)"),
        "active-directory-kerberoasting-as-rep-roasting-2026"
      );
    });
  });

  describe("6. DOCX Word Document Generation", () => {
    it("should generate valid DOCX binary buffers without errors", async () => {
      const docxBuffer = await generateArticleDocx({
        title: "Test Security Advisory",
        subtitle: "Technical analysis of CVE-2026-1001",
        authorName: "SecOps Lead",
        publishedAt: new Date(),
        content: `# Executive Summary\n\nThis is a test paragraph.\n\n\`\`\`bash\nnmap -sV 10.10.10.10\n\`\`\`\n\n- Bullet 1\n- Bullet 2\n`,
      });

      assert.ok(Buffer.isBuffer(docxBuffer));
      assert.ok(docxBuffer.length > 1000);
      // Word documents start with standard PK zip magic bytes (0x50, 0x4B)
      assert.equal(docxBuffer[0], 0x50);
      assert.equal(docxBuffer[1], 0x4b);
    });
  });
});
