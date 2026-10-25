"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Flag,
  BookOpen,
  ArrowRight,
  Terminal,
  Layers,
  Cpu,
  Bookmark,
} from "lucide-react";

export interface WriteUpItem {
  id: string;
  title: string;
  slug: string;
  platform: string;
  machineName?: string;
  difficulty: string;
  os: string;
  overview: string;
  publishedAt?: Date | string | null;
}

export interface KnowledgeDocItem {
  id: string;
  title: string;
  slug: string;
  folder: string;
  category: string;
  content?: string;
  updatedAt?: Date | string | null;
}

interface LabKnowledgeSectionProps {
  recentWriteups: WriteUpItem[];
  kbDocs: KnowledgeDocItem[];
}

type TabType = "ALL" | "WRITEUPS" | "KB";

export function LabKnowledgeSection({
  recentWriteups,
  kbDocs,
}: LabKnowledgeSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>("ALL");

  const totalCount = recentWriteups.length + kbDocs.length;

  const getDifficultyBadge = (diff: string) => {
    switch (diff.toUpperCase()) {
      case "EASY":
        return "bg-emerald-950/70 border-emerald-500/40 text-emerald-400";
      case "HARD":
        return "bg-red-950/70 border-[#ff3366]/40 text-[#ff3366]";
      case "INSANE":
        return "bg-purple-950/70 border-purple-500/40 text-purple-400";
      case "MEDIUM":
      default:
        return "bg-amber-950/70 border-amber-500/40 text-amber-400";
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Unified Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E2E4EB] dark:border-[#1f3352] pb-3 gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base sm:text-lg font-bold font-mono tracking-wider text-[#0D0D1A] dark:text-slate-100 flex items-center gap-2">
            <Flag className="w-4 h-4 text-[#3AAA00] dark:text-[#9fef00] animate-pulse" />
            LAB OPERATIONS & TACTICAL KB
          </h2>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#E8EAF0] dark:bg-[#0b121e] p-1 rounded-lg border border-[#E2E4EB] dark:border-[#1f3352]">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "ALL"
                  ? "bg-[#FFFFFF] text-[#0D0D1A] border border-[#9FEF00] shadow-sm dark:bg-[#14233c] dark:text-[#9fef00] dark:border-[#9fef00]/40"
                  : "text-[#4A4A6A] hover:text-[#0D0D1A] hover:bg-[#FFFFFF]/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-[#14233c]/60"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>All</span>
              <span className="text-[10px] opacity-70">({totalCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("WRITEUPS")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "WRITEUPS"
                  ? "bg-[#FFFFFF] text-[#0D0D1A] border border-[#9FEF00] shadow-sm dark:bg-[#14233c] dark:text-[#9fef00] dark:border-[#9fef00]/40"
                  : "text-[#4A4A6A] hover:text-[#0D0D1A] hover:bg-[#FFFFFF]/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-[#14233c]/60"
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>Lab Write-ups</span>
              <span className="text-[10px] opacity-70">({recentWriteups.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("KB")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "KB"
                  ? "bg-[#FFFFFF] text-[#0090CC] border border-[#00B4D8]/50 shadow-sm dark:bg-[#14233c] dark:text-[#2de2e6] dark:border-[#2de2e6]/40"
                  : "text-[#4A4A6A] hover:text-[#0D0D1A] hover:bg-[#FFFFFF]/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-[#14233c]/60"
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>Tactical KB</span>
              <span className="text-[10px] opacity-70">({kbDocs.length})</span>
            </button>
          </div>
        </div>

        {/* View All dynamic links */}
        <div className="flex items-center gap-3">
          {activeTab === "KB" ? (
            <Link
              href="/knowledge"
              className="text-xs font-mono text-[#0090CC] dark:text-[#2de2e6] hover:underline flex items-center gap-1 font-semibold"
            >
              Open KB &rarr;
            </Link>
          ) : (
            <Link
              href="/writeups"
              className="text-xs font-mono text-[#3AAA00] dark:text-[#9fef00] hover:underline flex items-center gap-1 font-semibold"
            >
              Browse all labs &rarr;
            </Link>
          )}
        </div>
      </div>

      {/* Cards Grid: Compact, sleek, responsive cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Render Lab Writeups if ALL or WRITEUPS */}
        {(activeTab === "ALL" || activeTab === "WRITEUPS") &&
          recentWriteups.map((w) => (
            <div
              key={w.id}
              className="group relative p-4 rounded-xl border border-[#E2E4EB] dark:border-[#1f3352] bg-[#FFFFFF] dark:bg-[#111d30]/90 hover:bg-[#F0F2F5] dark:hover:bg-[#14233c] hover:border-[#9FEF00] hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Meta header */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-[#E8FFF0] dark:bg-[#0b121e] border border-[#9FEF00]/50 dark:border-[#9fef00]/30 text-[#0D0D1A] dark:text-[#9fef00] font-bold">
                    {w.platform}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase border font-bold ${getDifficultyBadge(
                      w.difficulty
                    )}`}
                  >
                    {w.difficulty}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-[#E8EAF0] dark:bg-[#14233c] text-[#4A4A6A] dark:text-slate-300 border border-[#E2E4EB] dark:border-[#1f3352]">
                    {w.os}
                  </span>
                  {w.machineName && (
                    <span className="text-[10px] text-[#9A9AB0] dark:text-slate-500 font-mono ml-auto">
                      box: {w.machineName}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-sm sm:text-base font-bold text-[#0D0D1A] dark:text-slate-100 group-hover:text-[#3AAA00] dark:group-hover:text-[#9fef00] transition-colors mb-1.5 font-mono leading-snug line-clamp-1">
                  <Link href={`/writeups/${w.slug}`}>{w.title}</Link>
                </h3>

                {/* Overview */}
                <p className="text-xs text-[#4A4A6A] dark:text-slate-300/90 leading-relaxed line-clamp-2 font-sans mb-3">
                  {w.overview}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2.5 border-t border-[#E2E4EB] dark:border-[#1f3352]/70 text-xs">
                <span className="font-mono text-[10px] text-[#4A4A6A] dark:text-slate-400 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-[#3AAA00] dark:text-[#9fef00]" />
                  <span>Interactive Machine</span>
                </span>

                <Link
                  href={`/writeups/${w.slug}`}
                  className="text-[#3AAA00] dark:text-[#9fef00] hover:text-[#77C400] dark:hover:text-[#b4fa1f] font-mono text-xs flex items-center gap-1 font-bold transition-all group-hover:translate-x-0.5"
                >
                  Walkthrough &rarr;
                </Link>
              </div>
            </div>
          ))}

        {/* Render Knowledge Docs if ALL or KB */}
        {(activeTab === "ALL" || activeTab === "KB") &&
          kbDocs.map((doc) => (
            <div
              key={doc.id}
              className="group relative p-4 rounded-xl border border-[#E2E4EB] dark:border-[#2de2e6]/30 bg-[#FFFFFF] dark:bg-[#111d30]/90 hover:bg-[#F0F2F5] dark:hover:bg-[#14233c] hover:border-[#00B4D8] hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Meta header */}
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-[#E8F8FC] dark:bg-[#14233c] border border-[#00B4D8]/30 dark:border-[#2de2e6]/40 text-[#0090CC] dark:text-[#2de2e6] font-bold">
                    <BookOpen className="w-2.5 h-2.5" /> CHEAT SHEET
                  </span>
                  <span className="text-[10px] font-mono text-[#0090CC] dark:text-[#2de2e6] bg-[#E8EAF0] dark:bg-[#0b121e] px-1.5 py-0.5 rounded border border-[#E2E4EB] dark:border-[#2de2e6]/20">
                    {doc.folder}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm sm:text-base font-bold text-[#0D0D1A] dark:text-slate-100 group-hover:text-[#0090CC] dark:group-hover:text-[#2de2e6] transition-colors mb-1.5 font-mono leading-snug line-clamp-2">
                  <Link href={`/knowledge/${doc.slug}`}>{doc.title}</Link>
                </h3>

                {/* Category note / summary */}
                <p className="text-xs text-[#4A4A6A] dark:text-slate-300/90 leading-relaxed line-clamp-2 font-sans mb-3">
                  Tactical reference, attack vectors, privilege escalation formulas, and verification commands for {doc.folder} environments.
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2.5 border-t border-[#E2E4EB] dark:border-[#1f3352]/70 text-xs">
                <span className="font-mono text-[10px] text-[#4A4A6A] dark:text-slate-400 flex items-center gap-1">
                  <Bookmark className="w-3 h-3 text-[#0090CC] dark:text-[#2de2e6]" />
                  <span>{doc.category || "Notes"}</span>
                </span>

                <Link
                  href={`/knowledge/${doc.slug}`}
                  className="text-[#0090CC] dark:text-[#2de2e6] hover:text-[#00B4D8] dark:hover:text-[#5ef0f3] font-mono text-xs flex items-center gap-1 font-bold transition-all group-hover:translate-x-0.5"
                >
                  Open doc &rarr;
                </Link>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}
