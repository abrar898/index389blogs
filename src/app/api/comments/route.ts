import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.redirect(new URL("/login?error=Please+sign+in+to+post+comments", req.url), 303);
    }

    const formData = await req.formData();
    const articleId = formData.get("articleId") as string;
    const content = (formData.get("content") as string)?.trim();

    if (!articleId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const article = await db.article.findUnique({ where: { id: articleId } });
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    await db.comment.create({
      data: {
        articleId,
        authorId: user.id,
        content,
        status: "APPROVED",
      },
    });

    return NextResponse.redirect(new URL(`/articles/${article.slug}#comments`, req.url), 303);
  } catch (err: any) {
    console.error("Comment submission error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
