import Link from "next/link";
import { db } from "@/lib/db";
import {
  ShieldAlert,
  Terminal,
  Flag,
  BookOpen,
  ArrowRight,
  Clock,
  User,
  Calendar,
  MessageSquare,
  Sparkles,
  Lock,
} from "lucide-react";
import { FeaturedIntelSection } from "@/components/home/FeaturedIntelSection";
import { LabKnowledgeSection } from "@/components/home/LabKnowledgeSection";

export default async function HomePage() {
  const [featuredArticles, latestResearch, recentCVEs, recentWriteups, kbDocs, discussions, categories] =
    await Promise.all([
      db.article.findMany({
        where: { status: "PUBLISHED", visibility: { in: ["PUBLIC", "PRIVATE"] }, isFeatured: true },
        include: { author: true, category: true, tags: { include: { tag: true } } },
        take: 3,
        orderBy: { publishedAt: "desc" },
      }),
      db.article.findMany({
        where: { status: "PUBLISHED", visibility: { in: ["PUBLIC", "PRIVATE"] } },
        include: { author: true, category: true },
        take: 4,
        orderBy: { publishedAt: "desc" },
      }),
      db.cVERecord.findMany({
        where: { isPublished: true },
        take: 4,
        orderBy: { publishedAt: "desc" },
      }),
      db.writeUp.findMany({
        where: { status: "PUBLISHED" },
        take: 3,
        orderBy: { publishedAt: "desc" },
      }),
      db.knowledgeDocument.findMany({
        where: { visibility: "PUBLIC" },
        take: 4,
        orderBy: { updatedAt: "desc" },
      }),
      db.discussion.findMany({
        take: 3,
        include: { author: true, _count: { select: { replies: true } } },
        orderBy: { createdAt: "desc" },
      }),
      db.category.findMany({
        take: 6,
        include: { _count: { select: { articles: true } } },
      }),
    ]);

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative border-b border-[#1f3352] bg-[#0c1421] py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(159,239,0,0.12),transparent_70%)]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#9fef00]/30 bg-[#9fef00]/10 text-[#9fef00] text-xs font-mono font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#9fef00] animate-pulse"></span>
              CYBERSECURITY RESEARCH & KNOWLEDGE BASE
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight">
              Rigorous Security Research. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9fef00] via-[#aefc0a] to-[#2de2e6]">
                Actionable Verification.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-sans">
              An independent technical repository delivering CVE vulnerability analysis, red team offensive methodology, TryHackMe & Hack The Box write-ups, and operational cheat sheets.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/articles"
                className="px-5 py-2.5 rounded-lg bg-[#9fef00] hover:bg-[#b4fa1f] text-[#0b121e] font-bold text-sm transition-all shadow-[0_0_20px_rgba(159,239,0,0.3)] flex items-center gap-2 font-mono"
              >
                <span>Explore Articles</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/vulnerabilities"
                className="px-5 py-2.5 rounded-lg bg-[#111d30] hover:bg-[#14233c] border border-[#1f3352] hover:border-[#9fef00]/50 text-slate-200 font-semibold text-sm transition-colors flex items-center gap-2 font-mono"
              >
                <ShieldAlert className="w-4 h-4 text-[#ff3366]" />
                <span>CVE Tracker</span>
              </Link>
              <Link
                href="/knowledge"
                className="px-5 py-2.5 rounded-lg bg-[#111d30] hover:bg-[#14233c] border border-[#1f3352] hover:border-[#9fef00]/50 text-slate-200 font-semibold text-sm transition-colors flex items-center gap-2 font-mono"
              >
                <BookOpen className="w-4 h-4 text-[#9fef00]" />
                <span>Knowledge Base</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="p-3.5 rounded-lg border border-[#1f3352] bg-[#111d30] hover:bg-[#14233c] hover:border-[#9fef00]/50 transition-all group"
            >
              <div className="text-xs font-mono text-slate-300 group-hover:text-[#9fef00] transition-colors flex items-center justify-between">
                <span>{cat.name}</span>
                <span className="text-[10px] text-slate-400 font-bold">{cat._count.articles}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Intelligence: Papers & Critical CVEs */}
      <FeaturedIntelSection
        featuredArticles={featuredArticles}
        recentCVEs={recentCVEs}
      />

      {/* Lab Operations & Tactical Knowledge */}
      <LabKnowledgeSection
        recentWriteups={recentWriteups}
        kbDocs={kbDocs}
      />

      {/* Community Trending Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 rounded-xl border border-[#1f3352] bg-[#111d30] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1f3352] pb-3">
            <h3 className="text-sm font-mono font-bold tracking-wider text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#9fef00]" />
              COMMUNITY DISCUSSIONS
            </h3>
            <Link href="/community" className="text-xs font-mono text-[#9fef00] hover:underline font-semibold">
              Join discussion &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {discussions.map((d) => (
              <Link
                key={d.id}
                href={`/community/discussions/${d.slug}`}
                className="p-4 rounded-lg border border-[#1f3352] bg-[#14233c] hover:border-[#9fef00]/50 transition-all block space-y-2"
              >
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#111d30] text-[#9fef00] border border-[#9fef00]/30 font-bold">
                  {d.category}
                </span>
                <h4 className="text-xs font-bold text-slate-100 line-clamp-1 font-mono">{d.title}</h4>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                  <span>By {d.author.name}</span>
                  <span>{d._count.replies} replies</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-xl border border-[#1f3352] bg-gradient-to-r from-[#111d30] via-[#14233c] to-[#0b121e] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-xl font-bold text-slate-100 font-mono flex items-center gap-2">
              <span className="text-[#9fef00]">{">"}</span> SUBSCRIBE TO INDEX 389 DISCLOSURES
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Receive zero-day breakdowns, verified exploit analysis, and defense architecture guides directly in your inbox. No spam. One-click unsubscribe.
            </p>
          </div>

          <form action="/api/newsletter/subscribe" method="POST" className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
            <input
              type="email"
              name="email"
              required
              placeholder="operator@domain.local"
              className="px-4 py-2.5 rounded-lg bg-[#0b121e] border border-[#1f3352] text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#9fef00] font-mono w-full sm:w-72"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#9fef00] hover:bg-[#b4fa1f] text-[#0b121e] font-bold text-xs uppercase font-mono transition-colors whitespace-nowrap shadow-[0_0_15px_rgba(159,239,0,0.3)] text-center justify-center flex items-center"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
