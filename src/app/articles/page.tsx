import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { Clock, User, Calendar, Tag, ArrowRight, Lock } from "lucide-react";
import { SavedArticlesSection } from "@/components/articles/SavedArticlesSection";

export const metadata = {
  title: "Cybersecurity Articles & Tutorials",
  description: "Browse in-depth cybersecurity tutorials, defensive strategies, offensive security guides, and research publications.",
};

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string }>;
}) {
  const { category, tag } = await searchParams;
  const currentUser = await getCurrentUser();

  const whereClause: any = {
    status: "PUBLISHED",
    visibility: { in: ["PUBLIC", "PRIVATE"] },
  };

  if (category) {
    whereClause.category = { slug: category };
  }

  if (tag) {
    whereClause.tags = { some: { tag: { slug: tag } } };
  }

  const [articles, categories, tags] = await Promise.all([
    db.article.findMany({
      where: whereClause,
      include: {
        author: true,
        category: true,
        tags: { include: { tag: true } },
      },
      orderBy: { publishedAt: "desc" },
    }),
    db.category.findMany({
      include: { _count: { select: { articles: true } } },
    }),
    db.tag.findMany(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Title */}
      <div className="border-b border-[#E2E4EB] dark:border-[#1f3352] pb-6 mb-8">
        <h1 className="text-3xl font-extrabold text-[#0D0D1A] dark:text-slate-100 font-mono tracking-tight flex items-center gap-2">
          <span className="text-[#3AAA00] dark:text-[#9fef00]">{">"}</span> CYBERSECURITY ARTICLES & RESEARCH
        </h1>
        <p className="text-sm text-[#4A4A6A] dark:text-slate-300 mt-2 max-w-2xl font-sans">
          Technical guides, defensive architectures, penetration testing methodologies, and original research publications.
        </p>
      </div>

      {/* Saved Articles Feature */}
      <SavedArticlesSection />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {articles.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-[#E2E4EB] dark:border-[#1f3352] bg-[#FFFFFF] dark:bg-[#111d30] shadow-sm">
              <p className="text-[#4A4A6A] dark:text-slate-400 text-sm font-mono">No articles found matching the selected filter criteria.</p>
              <Link href="/articles" className="inline-block mt-3 text-xs text-[#3AAA00] dark:text-[#9fef00] hover:underline font-mono">
                Clear filters
              </Link>
            </div>
          ) : (
            articles.map((article) => (
              <article
                key={article.id}
                className="p-4 sm:p-5 rounded-xl border border-[#E2E4EB] dark:border-[#1f3352] bg-[#FFFFFF] dark:bg-[#111d30]/80 hover:bg-[#F0F2F5] dark:hover:bg-[#14233c] hover:border-[#9FEF00] hover:shadow-md transition-all space-y-2.5 group"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {article.visibility === "PRIVATE" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-400 font-bold">
                      <Lock className="w-2.5 h-2.5" /> PRIVATE
                    </span>
                  )}
                  {article.category && (
                    <Link
                      href={`/articles?category=${article.category.slug}`}
                      className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#E8FFF0] dark:bg-[#14233c] border border-[#9FEF00]/50 dark:border-[#9fef00]/30 text-[#0D0D1A] dark:text-[#9fef00] hover:border-[#9FEF00] font-bold"
                    >
                      {article.category.name}
                    </Link>
                  )}
                  <span className="text-[11px] text-[#4A4A6A] dark:text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#3AAA00] dark:text-[#9fef00]" /> {article.readingTimeMinutes} min
                  </span>
                  <span className="text-[11px] text-[#4A4A6A] dark:text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#9A9AB0] dark:text-slate-500" />
                    {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : ""}
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-bold text-[#0D0D1A] dark:text-slate-100 group-hover:text-[#3AAA00] dark:group-hover:text-[#9fef00] transition-colors font-mono leading-snug">
                  <Link href={`/articles/${article.slug}`}>{article.title}</Link>
                </h2>

                {article.subtitle && (
                  <p className="text-[11px] font-mono text-[#4A4A6A] dark:text-slate-400">{article.subtitle}</p>
                )}

                <p className="text-xs text-[#4A4A6A] dark:text-slate-300 leading-relaxed line-clamp-2 font-sans">
                  {article.summary}
                </p>

                <div className="flex flex-wrap gap-1 pt-0.5">
                  {article.tags.map((t) => (
                    <Link
                      key={t.tag.id}
                      href={`/articles?tag=${t.tag.slug}`}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#E8EAF0] dark:bg-[#0b121e] border border-[#E2E4EB] dark:border-[#1f3352] text-[#4A4A6A] dark:text-slate-300 hover:text-[#0D0D1A] dark:hover:text-[#9fef00] hover:border-[#9FEF00] transition-colors"
                    >
                      #{t.tag.name}
                    </Link>
                  ))}
                </div>

                <div className="pt-2.5 border-t border-[#E2E4EB] dark:border-[#1f3352]/70 flex items-center justify-between text-xs text-[#4A4A6A] dark:text-slate-400 font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#E8EAF0] dark:bg-[#0b121e] border border-[#E2E4EB] dark:border-[#1f3352] flex items-center justify-center text-[10px] text-[#0D0D1A] dark:text-[#9fef00] font-bold">
                      {article.author.name.charAt(0)}
                    </div>
                    <span className="text-[11px]">{article.author.name}</span>
                  </div>

                  <Link
                    href={`/articles/${article.slug}`}
                    className="text-[#3AAA00] dark:text-[#9fef00] hover:text-[#77C400] dark:hover:text-[#b4fa1f] font-mono text-xs flex items-center gap-1 font-bold"
                  >
                    Read &rarr;
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Filters Sidebar */}
        <div className="space-y-6">
          {/* Categories Filter */}
          <div className="p-5 rounded-xl border border-[#E2E4EB] dark:border-[#1f3352] bg-[#FFFFFF] dark:bg-[#111d30] space-y-3 shadow-sm">
            <h3 className="text-xs font-mono font-bold tracking-wider text-[#0D0D1A] dark:text-[#9fef00] uppercase">
              Filter by Category
            </h3>
            <ul className="space-y-1.5 text-xs font-mono">
              <li>
                <Link
                  href="/articles"
                  className={`block px-2.5 py-1.5 rounded transition-colors ${
                    !category
                      ? "bg-[#1A1A2E] text-[#9FEF00] dark:bg-[#9fef00] dark:text-[#0b121e] font-bold"
                      : "text-[#4A4A6A] hover:text-[#0D0D1A] hover:bg-[#F0F2F5] dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#14233c]"
                  }`}
                >
                  All Categories
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/articles?category=${c.slug}`}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded transition-colors ${
                      category === c.slug
                        ? "bg-[#1A1A2E] text-[#9FEF00] dark:bg-[#9fef00] dark:text-[#0b121e] font-bold"
                        : "text-[#4A4A6A] hover:text-[#0D0D1A] hover:bg-[#F0F2F5] dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#14233c]"
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className={`text-[10px] ${category === c.slug ? "text-[#9FEF00] dark:text-[#0b121e]" : "text-[#9A9AB0] dark:text-slate-400"}`}>
                      {c._count.articles}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tags Cloud */}
          <div className="p-5 rounded-xl border border-[#E2E4EB] dark:border-[#1f3352] bg-[#FFFFFF] dark:bg-[#111d30] space-y-3 shadow-sm">
            <h3 className="text-xs font-mono font-bold tracking-wider text-[#0D0D1A] dark:text-[#9fef00] uppercase">
              Topics & Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <Link
                  key={t.id}
                  href={`/articles?tag=${t.slug}`}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                    tag === t.slug
                      ? "bg-[#1A1A2E] text-[#9FEF00] dark:bg-[#9fef00] dark:text-[#0b121e] font-bold"
                      : "bg-[#E8EAF0] text-[#4A4A6A] hover:text-[#0D0D1A] dark:bg-[#14233c] dark:text-slate-300 dark:hover:text-[#9fef00] border border-[#E2E4EB] dark:border-[#1f3352]"
                  }`}
                >
                  #{t.slug}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
