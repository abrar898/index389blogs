import Link from "next/link";
import Image from "next/image";
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
      {/* Hero Section */}
      <section className="relative border-b border-[#E2E4EB] dark:border-[var(--surface-border)] bg-[#F0F2F5] dark:bg-[var(--surface-card)] py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(circle_at_50%_0%,var(--htb-green-glow),transparent_70%)] pointer-events-none"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="max-w-3xl space-y-6 flex-1">
            {/* FIX #1 / Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E2E4EB] dark:border-[var(--surface-border)] bg-[#E8FFF0] dark:bg-[var(--surface)] text-[#0D0D1A] dark:text-[var(--htb-green)] text-xs font-mono font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#9FEF00] animate-pulse"></span>
              CYBERSECURITY RESEARCH & KNOWLEDGE BASE
            </div>

            {/* FIX #2: Hero Heading Color (#0D0D1A on light) & FIX #3: Gradient Text (#3AAA00 -> #0090CC) */}
            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0D0D1A] dark:text-white tracking-tight leading-tight">
              Rigorous Security Research. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3AAA00] to-[#0090CC] dark:from-[#9FEF00] dark:to-[#00B4D8]">
                Actionable Verification.
              </span>
            </h1>

            {/* FIX #4: Body / Subtitle Text (#4A4A6A on light) */}
            <p className="text-base sm:text-lg text-[#4A4A6A] dark:text-slate-300 leading-relaxed max-w-2xl font-sans">
              An independent technical repository delivering CVE vulnerability analysis, red team offensive methodology, TryHackMe & Hack The Box write-ups, and operational cheat sheets.
            </p>

            {/* FIX #5: Primary button (bg: #1A1A2E color: #9FEF00 on light) & Card buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/cheatsheets"
                className="px-5 py-2.5 rounded-lg bg-[#1A1A2E] text-[#9FEF00] hover:bg-[#25253E] border border-[#1A1A2E] dark:bg-[#9FEF00] dark:hover:bg-[#77C400] dark:text-[#0D0D1A] dark:border-transparent font-bold text-sm transition-all shadow-md flex items-center gap-2 font-mono"
              >
                <Terminal className="w-4 h-4" />
                <span>⚡ Pentest Cheatsheets</span>
              </Link>
              <Link
                href="/articles"
                className="px-5 py-2.5 rounded-lg bg-[#FFFFFF] dark:bg-[var(--surface-card)] hover:bg-[#F0F2F5] dark:hover:bg-[var(--surface-elevated)] border border-[#E2E4EB] dark:border-[var(--surface-border)] hover:border-[#9FEF00] text-[#0D0D1A] dark:text-[var(--foreground-bright)] font-semibold text-sm transition-colors flex items-center gap-2 font-mono shadow-sm"
              >
                <span>Articles</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/vulnerabilities"
                className="px-5 py-2.5 rounded-lg bg-[#FFFFFF] dark:bg-[var(--surface-card)] hover:bg-[#F0F2F5] dark:hover:bg-[var(--surface-elevated)] border border-[#E2E4EB] dark:border-[var(--surface-border)] hover:border-[#FF4D4D]/50 text-[#0D0D1A] dark:text-[var(--foreground-bright)] font-semibold text-sm transition-colors flex items-center gap-2 font-mono shadow-sm"
              >
                <ShieldAlert className="w-4 h-4 text-[#FF4D4D]" />
                <span>CVE Tracker</span>
              </Link>
              <Link
                href="/knowledge"
                className="px-5 py-2.5 rounded-lg bg-[#FFFFFF] dark:bg-[var(--surface-card)] hover:bg-[#F0F2F5] dark:hover:bg-[var(--surface-elevated)] border border-[#E2E4EB] dark:border-[var(--surface-border)] hover:border-[#9FEF00] text-[#0D0D1A] dark:text-[var(--foreground-bright)] font-semibold text-sm transition-colors flex items-center gap-2 font-mono shadow-sm"
              >
                <BookOpen className="w-4 h-4 text-[#3AAA00] dark:text-[#9FEF00]" />
                <span>Knowledge Base</span>
              </Link>
            </div>
          </div>

          {/* FIX #6: Hero Emblem Logo Card (#FFFFFF on light) */}
          <div className="relative flex-shrink-0 flex items-center justify-center">
            <div className="relative w-48 h-48 sm:w-64 sm:h-64 lg:w-72 lg:h-72 rounded-full border-2 border-[#E2E4EB] dark:border-[var(--surface-border)] shadow-md p-2 bg-[#FFFFFF] dark:bg-[#090f19]/80 backdrop-blur-md group hover:border-[#9FEF00] transition-all">
              <div className="w-full h-full rounded-full overflow-hidden relative">
                <Image
                  src="/logo.png"
                  alt="Index 389 Emblem"
                  width={288}
                  height={288}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  priority
                />
              </div>
              <div className="absolute -inset-1 rounded-full border border-[#9FEF00]/20 pointer-events-none animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* FIX #7: Categories Bar (#FFFFFF cards alternating with #F0F2F5 background) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="p-3.5 rounded-lg border border-[#E2E4EB] dark:border-[var(--surface-border)] bg-[#FFFFFF] dark:bg-[var(--surface-card)] hover:bg-[#F0F2F5] dark:hover:bg-[var(--surface-elevated)] hover:border-[#9FEF00] transition-all group shadow-sm"
            >
              <div className="text-xs font-mono text-[#0D0D1A] dark:text-[var(--foreground)] group-hover:text-[#3AAA00] dark:group-hover:text-[#9FEF00] transition-colors flex items-center justify-between">
                <span>{cat.name}</span>
                <span className="text-[10px] text-[#4A4A6A] dark:text-[var(--foreground-muted)] font-bold">{cat._count.articles}</span>
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

      {/* Community Trending Section (#FFFFFF panel with #F0F2F5 cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 rounded-xl border border-[#E2E4EB] dark:border-[var(--surface-border)] bg-[#FFFFFF] dark:bg-[var(--surface-card)] space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E2E4EB] dark:border-[var(--surface-border)] pb-3">
            <h3 className="text-sm font-mono font-bold tracking-wider text-[#0D0D1A] dark:text-[var(--foreground-bright)] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#3AAA00] dark:text-[var(--htb-green)]" />
              COMMUNITY DISCUSSIONS
            </h3>
            <Link href="/community" className="text-xs font-mono text-[#3AAA00] dark:text-[var(--htb-green)] hover:underline font-semibold">
              Join discussion &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {discussions.map((d) => (
              <Link
                key={d.id}
                href={`/community/discussions/${d.slug}`}
                className="p-4 rounded-lg border border-[#E2E4EB] dark:border-[var(--surface-border)] bg-[#F0F2F5] dark:bg-[var(--surface)] hover:border-[#9FEF00] transition-all block space-y-2 shadow-xs"
              >
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#E8FFF0] dark:bg-[var(--surface-elevated)] text-[#0D0D1A] dark:text-[var(--htb-green)] border border-[#9FEF00] dark:border-[var(--surface-border)] font-bold">
                  {d.category}
                </span>
                <h4 className="text-xs font-bold text-[#0D0D1A] dark:text-[var(--foreground-bright)] line-clamp-1 font-mono">{d.title}</h4>
                <div className="flex items-center justify-between text-[11px] text-[#4A4A6A] dark:text-[var(--foreground-muted)] font-mono pt-1">
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
        <div className="p-8 rounded-xl border border-[#E2E4EB] dark:border-[var(--surface-border)] bg-[#FFFFFF] dark:bg-[var(--surface-card)] flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-xl font-bold text-[#0D0D1A] dark:text-[var(--foreground-bright)] font-mono flex items-center gap-2">
              <span className="text-[#3AAA00] dark:text-[var(--htb-green)]">{">"}</span> SUBSCRIBE TO INDEX 389 DISCLOSURES
            </h3>
            <p className="text-xs text-[#4A4A6A] dark:text-[var(--foreground)] leading-relaxed font-sans">
              Receive zero-day breakdowns, verified exploit analysis, and defense architecture guides directly in your inbox. No spam. One-click unsubscribe.
            </p>
          </div>

          <form action="/api/newsletter/subscribe" method="POST" className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
            <input
              type="email"
              name="email"
              required
              placeholder="operator@domain.local"
              className="px-4 py-2.5 rounded-lg bg-[#E8EAF0] dark:bg-[var(--surface)] border border-[#E2E4EB] dark:border-[var(--surface-border)] text-sm text-[#0D0D1A] dark:text-[var(--foreground-bright)] placeholder:text-[#9A9AB0] focus:outline-none focus:border-[#9FEF00] font-mono w-full sm:w-72"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#1A1A2E] text-[#9FEF00] hover:bg-[#25253E] dark:bg-[var(--htb-green)] dark:hover:bg-[var(--htb-green-hover)] dark:text-[#0D0D1A] font-bold text-xs uppercase font-mono transition-colors whitespace-nowrap shadow-sm text-center justify-center flex items-center border border-[#1A1A2E] dark:border-transparent"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
