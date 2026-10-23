import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getLeaderboard } from "@/lib/community/reputation";
import { OperatorLeaderboardWidget } from "@/components/community/OperatorLeaderboardWidget";
import { CommunityGuidelinesWidget } from "@/components/community/CommunityGuidelinesWidget";
import {
  MessageSquare,
  Pin,
  CheckCircle2,
  User,
  Plus,
  ArrowRight,
  Trophy,
  Flame,
  Search,
} from "lucide-react";

export const metadata = {
  title: "Security Community & Operator Discussions | CyberVault",
  description:
    "Engage with cybersecurity operators, discuss lab methodologies, offensive techniques, and career strategies.",
};

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const currentUser = await getCurrentUser();

  const whereClause: any = {};
  if (category) {
    whereClause.category = category.toUpperCase();
  }

  const [discussions, counts, topOperators] = await Promise.all([
    db.discussion.findMany({
      where: whereClause,
      include: {
        author: true,
        _count: { select: { replies: true } },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    }),
    db.discussion.groupBy({
      by: ["category"],
      _count: { id: true },
    }),
    getLeaderboard(5),
  ]);

  const categories = [
    { label: "All Topics", value: "" },
    { label: "General", value: "GENERAL" },
    { label: "Research", value: "RESEARCH" },
    { label: "Methodology", value: "METHODOLOGY" },
    { label: "Career & Certs", value: "CAREER" },
    { label: "Defensive Security", value: "DEFENSIVE" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#1f3352] gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#9fef00] mb-2">
            <MessageSquare className="w-4 h-4" />
            <span>OPERATOR COMMUNITY & TECHNICAL DISCUSSIONS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
            COMMUNITY DISCUSSIONS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl font-sans">
            Debate offensive techniques, share lab breakthroughs, collaborate on CVE disclosures, and level up with top-ranked security operators.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <Link
            href="/community/leaderboard"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#14233c] hover:bg-[#1f3352] text-[#9fef00] border border-[#9fef00]/40 font-bold text-xs font-mono transition-colors shadow-[0_0_12px_rgba(159,239,0,0.1)]"
          >
            <Trophy className="w-3.5 h-3.5" /> Leaderboard
          </Link>

          {currentUser ? (
            <Link
              href="/community/new"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#9fef00] hover:bg-[#b0ff1a] text-[#0b121e] font-bold text-xs font-mono transition-colors shadow-[0_0_15px_rgba(159,239,0,0.3)]"
            >
              <Plus className="w-3.5 h-3.5" /> Start Discussion
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0b121e] hover:bg-[#14233c] text-slate-200 border border-[#1f3352] font-bold text-xs font-mono transition-colors"
            >
              Sign In to Post
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid: 2 columns on desktop (Discussions + Leaderboard/Rules sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category filter tabs */}
          <div className="flex flex-wrap gap-2 text-xs font-mono pb-2">
            {categories.map((cat) => {
              const isSelected =
                (!category && cat.value === "") || category?.toUpperCase() === cat.value;
              return (
                <Link
                  key={cat.value}
                  href={cat.value === "" ? "/community" : `/community?category=${cat.value.toLowerCase()}`}
                  className={`px-3 py-1.5 rounded-lg border transition-colors ${
                    isSelected
                      ? "bg-[#9fef00]/15 border-[#9fef00] text-[#9fef00] font-bold shadow-[0_0_10px_rgba(159,239,0,0.15)]"
                      : "bg-[#111d30] border-[#1f3352] text-slate-400 hover:text-white hover:border-slate-500"
                  }`}
                >
                  {cat.label}
                </Link>
              );
            })}
          </div>

          {/* Discussions list */}
          <div className="space-y-3">
            {discussions.length === 0 ? (
              <div className="p-12 text-center rounded-xl border border-[#1f3352] bg-[#111d30]/60 font-mono text-xs text-slate-400 space-y-3">
                <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                <p>No discussions found in this category.</p>
                {currentUser && (
                  <Link
                    href="/community/new"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#9fef00] text-[#0b121e] font-bold text-xs font-mono"
                  >
                    <Plus className="w-3.5 h-3.5" /> Be the first to start a thread
                  </Link>
                )}
              </div>
            ) : (
              discussions.map((d) => (
                <article
                  key={d.id}
                  className={`p-4 sm:p-5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg group ${
                    d.isPinned
                      ? "border-[#9fef00]/60 bg-[#111d30]/95"
                      : "border-[#1f3352] bg-[#111d30]/80 hover:bg-[#14233c] hover:border-[#9fef00]/40"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {d.isPinned && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#9fef00]/20 text-[#9fef00] border border-[#9fef00]/50 flex items-center gap-1 font-bold">
                          <Pin className="w-2.5 h-2.5" /> PINNED
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#0b121e] border border-[#1f3352] text-slate-300 font-bold">
                        {d.category}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-100 group-hover:text-[#9fef00] transition-colors font-mono">
                      <Link href={`/community/discussions/${d.slug}`}>{d.title}</Link>
                    </h3>

                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <div className="w-4 h-4 rounded-full bg-[#0b121e] border border-[#1f3352] flex items-center justify-center text-[9px] text-[#9fef00] font-bold font-mono">
                        {d.author.name.charAt(0)}
                      </div>
                      <span>
                        By <strong className="text-slate-200">{d.author.name}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400 sm:text-right flex-shrink-0">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0b121e] border border-[#1f3352]">
                      <MessageSquare className="w-3.5 h-3.5 text-[#9fef00]" />
                      <span>{d._count.replies} replies</span>
                    </div>

                    <Link
                      href={`/community/discussions/${d.slug}`}
                      className="p-2 rounded bg-[#0b121e] border border-[#1f3352] group-hover:border-[#9fef00] text-slate-400 group-hover:text-[#9fef00] transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Column: Leaderboard + Rules of Engagement */}
        <div className="space-y-6">
          <OperatorLeaderboardWidget topOperators={topOperators} />
          <CommunityGuidelinesWidget />
        </div>
      </div>
    </div>
  );
}
