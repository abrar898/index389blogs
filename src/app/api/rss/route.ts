import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const articles = await db.article.findMany({
    where: { status: "PUBLISHED", visibility: "PUBLIC" },
    include: { author: true },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  const rssItems = articles
    .map(
      (a) => `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${baseUrl}/articles/${a.slug}</link>
      <guid>${baseUrl}/articles/${a.slug}</guid>
      <pubDate>${a.publishedAt ? new Date(a.publishedAt).toUTCString() : new Date().toUTCString()}</pubDate>
      <description><![CDATA[${a.summary}]]></description>
      <author><![CDATA[${a.author.name}]]></author>
    </item>`
    )
    .join("");

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>CyberVault — Cybersecurity Research &amp; Threat Intelligence</title>
    <link>${baseUrl}</link>
    <description>Verified vulnerability analysis, exploit breakdowns, and defensive architecture.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${rssItems}
  </channel>
</rss>`;

  return new NextResponse(rssFeed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
