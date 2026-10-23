import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { slugify } from "@/lib/markdown/renderer";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.redirect(
        new URL("/login?error=Please+sign+in+to+start+a+discussion", req.url),
        303
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json({ error: "Your account is suspended." }, { status: 403 });
    }

    const formData = await req.formData();
    const title = (formData.get("title") as string)?.trim();
    const content = (formData.get("content") as string)?.trim();
    const category = ((formData.get("category") as string) || "GENERAL").toUpperCase();

    // Protection: Basic validation and rate check
    if (!title || title.length < 5) {
      return NextResponse.redirect(
        new URL("/community/new?error=Title+must+be+at+least+5+characters", req.url),
        303
      );
    }

    if (!content || content.length < 15) {
      return NextResponse.redirect(
        new URL("/community/new?error=Content+must+be+at+least+15+characters", req.url),
        303
      );
    }

    // Protection: Anti-spam rate limiting (maximum 1 discussion every 30 seconds per user)
    const recentPost = await db.discussion.findFirst({
      where: {
        authorId: user.id,
        createdAt: {
          gte: new Date(Date.now() - 30 * 1000),
        },
      },
    });

    if (recentPost) {
      return NextResponse.redirect(
        new URL("/community/new?error=Please+wait+a+few+seconds+before+posting+again", req.url),
        303
      );
    }

    let slug = slugify(title);
    const existing = await db.discussion.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const discussion = await db.discussion.create({
      data: {
        title,
        slug,
        content,
        category,
        authorId: user.id,
      },
    });

    await logAudit({
      userId: user.id,
      action: "COMMUNITY_DISCUSSION_CREATE",
      entityType: "DISCUSSION",
      entityId: discussion.id,
      details: { title: discussion.title, category: discussion.category },
    });

    return NextResponse.redirect(
      new URL(`/community/discussions/${discussion.slug}`, req.url),
      303
    );
  } catch (err: any) {
    console.error("Create discussion error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
