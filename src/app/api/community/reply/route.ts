import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.redirect(new URL("/login?error=Please+sign+in+to+reply", req.url), 303);
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json({ error: "Your account is suspended." }, { status: 403 });
    }

    const formData = await req.formData();
    const discussionId = formData.get("discussionId") as string;
    const content = (formData.get("content") as string)?.trim();

    if (!discussionId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const discussion = await db.discussion.findUnique({ where: { id: discussionId } });
    if (!discussion) {
      return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
    }

    if (discussion.isLocked) {
      return NextResponse.json({ error: "This discussion thread has been locked by moderators." }, { status: 403 });
    }

    await db.discussionReply.create({
      data: {
        discussionId,
        authorId: user.id,
        content,
      },
    });

    // Notify discussion author if different user
    if (discussion.authorId !== user.id) {
      await db.notification.create({
        data: {
          userId: discussion.authorId,
          title: "New Discussion Reply",
          message: `${user.name} replied to your thread: "${discussion.title}"`,
          type: "COMMENT",
          link: `/community/discussions/${discussion.slug}`,
        },
      });
    }

    return NextResponse.redirect(new URL(`/community/discussions/${discussion.slug}`, req.url), 303);
  } catch (err: any) {
    console.error("Discussion reply error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
