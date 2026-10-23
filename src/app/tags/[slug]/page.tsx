import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ArrowLeft, Clock, ArrowRight } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tag = await db.tag.findUnique({ where: { slug } });
  if (!tag) return { title: "Tag Not Found | CyberVault" };
  return { title: `#${tag.name} Publications — CyberVault` };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const tag = await db.tag.findUnique({
    where: { slug },
    include: {
      articles: {
        include: {
          article: {
            include: { author: true, category: true },
          },
        },
      },
    },
  });

  if (!tag) notFound();

  const publishedArticles = tag.articles
    .map((at) => at.article)
    .filter((a) => a.status === "PUBLISHED" && a.visibility === "PUBLIC");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Link
        href="/articles"
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-[#9fef00] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to All Articles
      </Link>

      <div className="border-b border-[#1f3352] pb-6">
        <span className="text-xs font-mono text-[#9fef00] uppercase font-bold">TOPIC TAXONOMY</span>
        <h1 className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight mt-1">
          #{tag.name}
        </h1>
      </div>

      <div className="space-y-4">
        {publishedArticles.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-[#1f3352] bg-[#111d30]/60 font-mono text-xs text-slate-400">
            No published articles with this tag yet.
          </div>
        ) : (
          publishedArticles.map((article) => (
            <article
              key={article.id}
              className="p-6 rounded-xl border border-[#1f3352] bg-[#111d30]/90 hover:border-[#9fef00]/60 transition-all space-y-3 shadow-lg group"
            >
              <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#9fef00]" /> {article.readingTimeMinutes} min read
                </span>
                <span>•</span>
                <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : ""}</span>
              </div>

              <h2 className="text-xl font-bold text-slate-100 group-hover:text-[#9fef00] transition-colors">
                <Link href={`/articles/${article.slug}`}>{article.title}</Link>
              </h2>

              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 font-sans">{article.summary}</p>

              <div className="pt-2 flex items-center justify-between text-xs font-mono border-t border-[#1f3352]/60">
                <span className="text-slate-400">Author: {article.author.name}</span>
                <Link
                  href={`/articles/${article.slug}`}
                  className="text-[#9fef00] hover:text-white font-semibold flex items-center gap-1 transition-colors"
                >
                  Read Article <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
