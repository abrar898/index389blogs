"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Clock,
  Lock,
  Terminal,
  FileText,
  Layers,
} from "lucide-react";

interface Author {
  name: string;
}

interface Category {
  name: string;
}

export interface FeaturedArticleItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  readingTimeMinutes: number;
  publishedAt: Date | string | null;
  visibility: string;
  author: Author;
  category: Category | null;
}

export interface FeaturedCVEItem {
  id: string;
  cveId: string;
  title: string;
  summary: string;
  severity: string;
  cvssScore: number;
  affectedProducts: string;
  publishedAt: Date | string | null;
}

interface FeaturedIntelSectionProps {
  featuredArticles: FeaturedArticleItem[];
  recentCVEs: FeaturedCVEItem[];
}

type TabType = "ALL" | "RESEARCH" | "CVES";

export function FeaturedIntelSection({
  featuredArticles,
  recentCVEs,
}: FeaturedIntelSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>("ALL");

  const totalCount = featuredArticles.length + recentCVEs.length;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Unified Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1f3352] pb-3 gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base sm:text-lg font-bold font-mono tracking-wider text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#9fef00] animate-pulse" />
            FEATURED RESEARCH & INTEL
          </h2>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#0b121e] p-1 rounded-lg border border-[#1f3352]">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "ALL"
                  ? "bg-[#14233c] text-[#9fef00] border border-[#9fef00]/40 shadow-[0_0_12px_rgba(159,239,0,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#14233c]/60"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>All</span>
              <span className="text-[10px] opacity-70">({totalCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("RESEARCH")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "RESEARCH"
                  ? "bg-[#14233c] text-[#9fef00] border border-[#9fef00]/40 shadow-[0_0_12px_rgba(159,239,0,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#14233c]/60"
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Research</span>
              <span className="text-[10px] opacity-70">({featuredArticles.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("CVES")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "CVES"
                  ? "bg-[#14233c] text-[#ff3366] border border-[#ff3366]/40 shadow-[0_0_12px_rgba(255,51,102,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#14233c]/60"
              }`}
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Critical CVEs</span>
              <span className="text-[10px] opacity-70">({recentCVEs.length})</span>
            </button>
          </div>
        </div>

        {/* View All dynamic links */}
        <div className="flex items-center gap-3">
          {activeTab === "CVES" ? (
            <Link
              href="/vulnerabilities"
              className="text-xs font-mono text-[#ff3366] hover:underline flex items-center gap-1 font-semibold"
            >
              All CVEs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              href="/articles"
              className="text-xs font-mono text-[#9fef00] hover:underline flex items-center gap-1 font-semibold"
            >
              View all papers <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Cards Grid: Compact, sleek, responsive cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Render Research Articles if ALL or RESEARCH */}
        {(activeTab === "ALL" || activeTab === "RESEARCH") &&
          featuredArticles.map((article) => (
            <article
              key={article.id}
              className="group relative p-4 rounded-xl border border-[#1f3352] bg-[#111d30]/90 hover:bg-[#14233c] hover:border-[#9fef00]/60 hover:shadow-[0_4px_20px_rgba(159,239,0,0.12)] transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Meta header */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {article.visibility === "PRIVATE" && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-amber-500/15 border border-amber-500/40 text-amber-400 font-bold">
                      <Lock className="w-2.5 h-2.5" /> PRIVATE
                    </span>
                  )}
                  {article.category && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-[#0b121e] border border-[#9fef00]/30 text-[#9fef00] font-bold">
                      {article.category.name}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-[#9fef00]" /> {article.readingTimeMinutes} min
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono ml-auto">
                    {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : ""}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm sm:text-base font-bold text-slate-100 group-hover:text-[#9fef00] transition-colors mb-1.5 font-mono leading-snug line-clamp-2">
                  <Link href={`/articles/${article.slug}`}>{article.title}</Link>
                </h3>

                {/* Summary */}
                <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-2 font-sans mb-3">
                  {article.summary}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2.5 border-t border-[#1f3352]/70 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full bg-[#0b121e] border border-[#1f3352] flex items-center justify-center text-[9px] text-[#9fef00] font-bold font-mono">
                    {article.author.name.charAt(0)}
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 truncate max-w-[130px]">
                    {article.author.name}
                  </span>
                </div>

                <Link
                  href={`/articles/${article.slug}`}
                  className="text-[#9fef00] hover:text-[#b4fa1f] font-mono text-xs flex items-center gap-1 font-bold transition-all group-hover:translate-x-0.5"
                >
                  Read &rarr;
                </Link>
              </div>
            </article>
          ))}

        {/* Render Critical CVEs if ALL or CVES */}
        {(activeTab === "ALL" || activeTab === "CVES") &&
          recentCVEs.map((cve) => (
            <div
              key={cve.id}
              className="group relative p-4 rounded-xl border border-red-900/40 bg-[#111d30]/90 hover:bg-[#14233c] hover:border-[#ff3366]/60 hover:shadow-[0_4px_20px_rgba(255,51,102,0.12)] transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Meta header */}
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-red-950/60 border border-[#ff3366]/40 text-[#ff3366] font-bold">
                    <ShieldAlert className="w-2.5 h-2.5" /> CVE ADVISORY
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                      cve.severity === "CRITICAL"
                        ? "bg-red-950/90 text-[#ff3366] border border-[#ff3366]/50 shadow-[0_0_8px_rgba(255,51,102,0.2)]"
                        : "bg-amber-950/90 text-[#ff8400] border border-[#ff8400]/40"
                    }`}
                  >
                    CVSS {cve.cvssScore.toFixed(1)} {cve.severity}
                  </span>
                </div>

                {/* CVE ID and Title */}
                <div className="font-mono font-bold text-xs text-[#9fef00] mb-0.5">
                  <Link href={`/vulnerabilities/${cve.cveId}`}>{cve.cveId}</Link>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-100 group-hover:text-[#ff3366] transition-colors mb-1.5 font-mono leading-snug line-clamp-1">
                  <Link href={`/vulnerabilities/${cve.cveId}`}>{cve.title}</Link>
                </h3>

                {/* Summary */}
                <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-2 font-sans mb-3">
                  {cve.summary}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2.5 border-t border-[#1f3352]/70 text-xs">
                <span className="font-mono text-[10px] text-slate-400 truncate max-w-[130px] flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-slate-500" />
                  {cve.affectedProducts?.split(",")[0] || "Universal"}
                </span>

                <Link
                  href={`/vulnerabilities/${cve.cveId}`}
                  className="text-[#ff3366] hover:text-[#ff6688] font-mono text-xs flex items-center gap-1 font-bold transition-all group-hover:translate-x-0.5"
                >
                  Triage &rarr;
                </Link>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}
