import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateArticleDocx } from "@/lib/exports/docx-generator";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return new NextResponse("Missing article slug parameter", { status: 400 });
    }

    const article = await db.article.findUnique({
      where: { slug },
      include: { author: true },
    });

    if (!article) {
      return new NextResponse("Article not found", { status: 404 });
    }

    const buffer = await generateArticleDocx({
      title: article.title,
      subtitle: article.subtitle,
      authorName: article.author.name,
      publishedAt: article.publishedAt,
      content: article.content,
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${article.slug}.docx"`,
      },
    });
  } catch (err: any) {
    console.error("DOCX export error:", err);
    return new NextResponse(`Export failed: ${err.message}`, { status: 500 });
  }
}
