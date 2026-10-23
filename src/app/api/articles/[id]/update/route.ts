import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { calculateReadingTime, slugify } from "@/lib/markdown/renderer";
import { canEditArticle } from "@/lib/permissions/rbac";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    const existing = await db.article.findUnique({
      where: { id },
      include: { revisions: { orderBy: { version: "desc" }, take: 1 } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (!canEditArticle(user, existing.authorId)) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const formData = await req.formData();
    const title = (formData.get("title") as string)?.trim();
    const subtitle = (formData.get("subtitle") as string)?.trim() || null;
    const summary = (formData.get("summary") as string)?.trim();
    const content = formData.get("content") as string;
    const categoryId = (formData.get("categoryId") as string) || null;
    const status = (formData.get("status") as string) || existing.status;
    const visibility = (formData.get("visibility") as string) || existing.visibility;
    const isFeatured = formData.get("isFeatured") === "true";

    if (!title || !content || !summary) {
      return NextResponse.json({ error: "Title, summary, and content are required" }, { status: 400 });
    }

    const readingTimeMinutes = calculateReadingTime(content);
    const nextVersion = (existing.revisions[0]?.version || 1) + 1;

    // Update article and add revision
    const [updated] = await db.$transaction([
      db.article.update({
        where: { id },
        data: {
          title,
          subtitle,
          summary,
          content,
          categoryId: categoryId && categoryId !== "none" ? categoryId : null,
          status,
          visibility,
          isFeatured,
          readingTimeMinutes,
          publishedAt:
            status === "PUBLISHED" && !existing.publishedAt
              ? new Date()
              : existing.publishedAt,
        },
      }),
      db.articleRevision.create({
        data: {
          articleId: id,
          title,
          content,
          summary,
          version: nextVersion,
          createdById: user!.id,
          note: `Updated to version ${nextVersion}`,
        },
      }),
    ]);

    // Also update writeUp if corresponding writeUp exists or if this is a writeup article
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
      /writeup|htb|tryhackme|hackthebox|ctf|walkthrough/i.test(updated.slug);

    if (isWriteupCategory || isWriteupTitle) {
      const isHTB = /hackthebox|htb/i.test(`${title} ${updated.slug}`);
      const isTHM = /tryhackme|thm/i.test(`${title} ${updated.slug}`);
      const platform = isHTB ? "HACKTHEBOX" : isTHM ? "TRYHACKME" : "CTF";

      await db.writeUp.upsert({
        where: { slug: updated.slug },
        update: {
          title: updated.title,
          platform,
          machineName: title.replace(/^(HackTheBox|HTB|TryHackMe|THM)\s*[-—:]\s*/i, "").split(/[—–-]/)[0]?.trim() || title,
          overview: updated.summary,
          content: updated.content,
          status: updated.status,
          isFeatured: updated.isFeatured,
          publishedAt: updated.publishedAt || new Date(),
        },
        create: {
          title: updated.title,
          slug: updated.slug,
          platform,
          machineName: title.replace(/^(HackTheBox|HTB|TryHackMe|THM)\s*[-—:]\s*/i, "").split(/[—–-]/)[0]?.trim() || title,
          overview: updated.summary,
          content: updated.content,
          skillsRequired: "Enumeration, Initial Access, Privilege Escalation",
          skillsLearned: "Methodology, Tactical Exploitation, Remediation",
          authorId: user!.id,
          status: updated.status,
          isFeatured: updated.isFeatured,
          publishedAt: updated.publishedAt || new Date(),
        },
      });
    }

    await logAudit({
      userId: user!.id,
      action: "ARTICLE_UPDATE",
      entityType: "ARTICLE",
      entityId: id,
      details: { title: updated.title, version: nextVersion, status: updated.status },
    });

    return NextResponse.redirect(new URL(`/articles/${updated.slug}`, req.url), 303);
  } catch (err: any) {
    console.error("Update article error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
