import { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/articles`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/research`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/vulnerabilities`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/writeups`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/knowledge`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/community`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/subscribe`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/editorial-policy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/responsible-disclosure`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    // Dynamic published articles
    const articles = await db.article.findMany({
      where: { status: "PUBLISHED", visibility: "PUBLIC" },
      select: { slug: true, updatedAt: true },
    });

    const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
      url: `${baseUrl}/articles/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    // Dynamic CVEs
    const cves = await db.cVERecord.findMany({
      where: { isPublished: true },
      select: { cveId: true, updatedAt: true },
    });

    const cveRoutes: MetadataRoute.Sitemap = cves.map((c) => ({
      url: `${baseUrl}/vulnerabilities/${c.cveId}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    // Dynamic Write-ups
    const writeups = await db.writeUp.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    });

    const writeupRoutes: MetadataRoute.Sitemap = writeups.map((w) => ({
      url: `${baseUrl}/writeups/${w.slug}`,
      lastModified: w.updatedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...articleRoutes, ...cveRoutes, ...writeupRoutes];
  } catch (error) {
    console.warn("Could not query database during sitemap generation:", error);
    return staticRoutes;
  }
}
