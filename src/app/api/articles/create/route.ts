import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { calculateReadingTime, slugify } from "@/lib/markdown/renderer";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "EDITOR", "AUTHOR"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const title = (formData.get("title") as string)?.trim();
    let slug = (formData.get("slug") as string)?.trim();
    const subtitle = (formData.get("subtitle") as string)?.trim() || null;
    const summary = (formData.get("summary") as string)?.trim();
    const content = formData.get("content") as string;
    const categoryId = (formData.get("categoryId") as string) || null;
    const status = (formData.get("status") as string) || "DRAFT";
    const visibility = (formData.get("visibility") as string) || "PUBLIC";
    const isFeatured = formData.get("isFeatured") === "true";
    const tagsString = (formData.get("tags") as string) || "";

    if (!title || !content || !summary) {
      return NextResponse.json({ error: "Title, summary, and content are required" }, { status: 400 });
    }

    if (!slug) {
      slug = slugify(title);
    } else {
      slug = slugify(slug);
    }

    // Check slug collision
    const existing = await db.article.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const readingTimeMinutes = calculateReadingTime(content);

    const article = await db.article.create({
      data: {
        title,
        slug,
        subtitle,
        summary,
        content,
        categoryId: categoryId && categoryId !== "none" ? categoryId : null,
        authorId: user.id,
        status,
        visibility,
        isFeatured,
        readingTimeMinutes,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });

    // Handle tags
    if (tagsString) {
      const tagNames = tagsString.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
      for (const tName of tagNames) {
        const tSlug = slugify(tName);
        const tag = await db.tag.upsert({
          where: { slug: tSlug },
          update: {},
          create: { name: tName, slug: tSlug },
        });

        await db.articleTag.create({
          data: {
            articleId: article.id,
            tagId: tag.id,
          },
        });
      }
    }

    // Create initial revision
    await db.articleRevision.create({
      data: {
        articleId: article.id,
        title: article.title,
        content: article.content,
        summary: article.summary,
        version: 1,
        createdById: user.id,
        note: "Initial version",
      },
    });

    // If the article is a writeup (by title or category), automatically create/sync WriteUp table
    const isWriteupCategory = categoryId
      ? await db.category.findFirst({
          where: {
            id: categoryId,
            slug: { in: ["write-ups", "hackthebox-writeups", "tryhackme-writeups"] },
          },
        })
      : null;

    const isWriteupTitle =
      /writeup|htb|tryhackme|hackthebox|ctf|walkthrough/i.test(title) ||
      /writeup|htb|tryhackme|hackthebox|ctf|walkthrough/i.test(slug);

    if (isWriteupCategory || isWriteupTitle) {
      const isHTB = /hackthebox|htb/i.test(`${title} ${slug}`);
      const isTHM = /tryhackme|thm/i.test(`${title} ${slug}`);
      const platform = isHTB ? "HACKTHEBOX" : isTHM ? "TRYHACKME" : "CTF";

      await db.writeUp.upsert({
        where: { slug: article.slug },
        update: {
          title: article.title,
          platform,
          machineName: title.replace(/^(HackTheBox|HTB|TryHackMe|THM)\s*[-—:]\s*/i, "").split(/[—–-]/)[0]?.trim() || title,
          overview: article.summary,
          content: article.content,
          authorId: user.id,
          status: article.status,
          isFeatured: article.isFeatured,
          publishedAt: article.publishedAt || new Date(),
        },
        create: {
          title: article.title,
          slug: article.slug,
          platform,
          machineName: title.replace(/^(HackTheBox|HTB|TryHackMe|THM)\s*[-—:]\s*/i, "").split(/[—–-]/)[0]?.trim() || title,
          overview: article.summary,
          content: article.content,
          skillsRequired: "Enumeration, Initial Access, Privilege Escalation",
          skillsLearned: "Methodology, Tactical Exploitation, Remediation",
          authorId: user.id,
          status: article.status,
          isFeatured: article.isFeatured,
          publishedAt: article.publishedAt || new Date(),
        },
      });
    }

    await logAudit({
      userId: user.id,
      action: "ARTICLE_CREATE",
      entityType: "ARTICLE",
      entityId: article.id,
      details: { title: article.title, status: article.status },
    });

    return NextResponse.redirect(new URL(`/articles/${article.slug}`, req.url), 303);
  } catch (err: any) {
    console.error("Create article error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
