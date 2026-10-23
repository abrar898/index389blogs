import Link from "next/link";
import { db } from "@/lib/db";
import { Flag, Terminal, Filter, ArrowRight, ShieldCheck, User, Heart } from "lucide-react";

export const metadata = {
  title: "Hack The Box, TryHackMe & CTF Lab Write-ups",
  description: "Comprehensive penetration testing walkthroughs for Hack The Box, TryHackMe, and CTF machines.",
};

export default async function WriteupsPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string; difficulty?: string }>;
}) {
  const { platform, difficulty } = await searchParams;

  const whereClause: any = { status: "PUBLISHED" };

  if (platform) {
    whereClause.platform = platform.toUpperCase();
  }

  if (difficulty) {
    whereClause.difficulty = difficulty.toUpperCase();
  }

  const writeups = await db.writeUp.findMany({
    where: whereClause,
    include: { author: true },
    orderBy: { publishedAt: "desc" },
  });

  // Fetch likes counts in bulk
  const writeupIds = writeups.map((w) => w.id);
  const likesData = await db.bookmark.groupBy({
    by: ["contentId"],
    where: {
      contentType: "WRITEUP_LIKE",
      contentId: { in: writeupIds },
    },
    _count: { id: true },
  });

  const likesMap: Record<string, number> = {};
  likesData.forEach((item) => {
    likesMap[item.contentId] = item._count.id;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-[#1f3352] pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-[#9fef00] mb-2">
          <Flag className="w-4 h-4" />
          <span>OFFENSIVE SECURITY LAB METHODOLOGY & WRITE-UPS</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
          LAB & CTF WALKTHROUGHS
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-2xl font-sans">
          Detailed walkthroughs for retired Hack The Box machines, TryHackMe rooms, and CTF challenges with enumeration pipelines, initial access proofs, and privilege escalation techniques.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-xl border border-[#1f3352] bg-[#111d30] text-xs font-mono shadow-lg">
        {/* Platform filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Platform:</span>
          {["ALL", "HACKTHEBOX", "TRYHACKME", "CTF"].map((p) => {
            const isSelected = (!platform && p === "ALL") || platform?.toUpperCase() === p;
            return (
              <Link
                key={p}
                href={p === "ALL" ? "/writeups" : `/writeups?platform=${p.toLowerCase()}`}
                className={`px-3 py-1 rounded transition-colors ${
                  isSelected
                    ? "bg-[#9fef00] text-[#0b121e] font-bold shadow-[0_0_12px_rgba(159,239,0,0.3)]"
                    : "bg-[#0b121e] border border-[#1f3352] text-slate-300 hover:text-white hover:border-[#9fef00]/50"
                }`}
              >
                {p}
              </Link>
            );
          })}
        </div>

        {/* Difficulty filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Difficulty:</span>
          {["ALL", "EASY", "MEDIUM", "HARD", "INSANE"].map((d) => {
            const isSelected = (!difficulty && d === "ALL") || difficulty?.toUpperCase() === d;
            return (
              <Link
                key={d}
                href={d === "ALL" ? "/writeups" : `/writeups?difficulty=${d.toLowerCase()}`}
                className={`px-2.5 py-1 rounded transition-colors ${
                  isSelected
                    ? "bg-[#2de2e6] text-[#0b121e] font-bold shadow-[0_0_12px_rgba(45,226,230,0.3)]"
                    : "bg-[#0b121e] border border-[#1f3352] text-slate-300 hover:text-white hover:border-[#2de2e6]/50"
                }`}
              >
                {d}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Write-ups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {writeups.length === 0 ? (
          <div className="col-span-2 p-8 text-center rounded-xl border border-[#1f3352] bg-[#111d30]/60 font-mono text-xs text-slate-400">
            No lab write-ups match the selected filters.
          </div>
        ) : (
          writeups.map((w) => (
            <div
              key={w.id}
              className="p-6 rounded-xl border border-[#1f3352] bg-[#111d30]/90 hover:border-[#9fef00]/60 transition-all space-y-4 group shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#9fef00]/15 border border-[#9fef00]/40 text-[#9fef00] font-bold">
                    {w.platform}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#0b121e] border border-[#1f3352] text-slate-200">
                    {w.difficulty}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#0b121e] border border-[#1f3352] text-slate-400">
                    {w.os}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  {(likesMap[w.id] ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-rose-400 font-semibold">
                      <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                      {likesMap[w.id]}
                    </span>
                  )}
                  <span className="text-slate-400">
                    {new Date(w.publishedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-100 group-hover:text-[#9fef00] transition-colors">
                  <Link href={`/writeups/${w.slug}`}>{w.title}</Link>
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed line-clamp-3 font-sans">
                  {w.overview}
                </p>
              </div>

              {/* Skills tags */}
              <div className="space-y-1.5 pt-2 border-t border-[#1f3352] text-xs font-mono">
                <div className="text-slate-400 text-[11px]">
                  <strong className="text-slate-300">Required:</strong> {w.skillsRequired}
                </div>
                <div className="text-slate-400 text-[11px]">
                  <strong className="text-[#9fef00]">Learned:</strong> {w.skillsLearned}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Operator: {w.author.name}</span>
                <Link
                  href={`/writeups/${w.slug}`}
                  className="text-[#9fef00] hover:text-white flex items-center gap-1 font-semibold transition-colors"
                >
                  View Walkthrough <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
