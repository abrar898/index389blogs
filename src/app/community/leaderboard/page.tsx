import Link from "next/link";
import { getLeaderboard, RANK_TIERS, REPUTATION_WEIGHTS } from "@/lib/community/reputation";
import {
  Trophy,
  Award,
  Shield,
  Zap,
  ArrowLeft,
  Flame,
  CheckCircle2,
  FileCode,
  Terminal,
  Flag,
  BookOpen,
  MessageSquare,
} from "lucide-react";

export const metadata = {
  title: "Operator Leaderboard & Hall of Fame | CyberVault",
  description:
    "Top cybersecurity researchers, exploit analysts, and lab operators ranked by verified technical intelligence and peer solutions.",
};

export default async function LeaderboardPage() {
  const operators = await getLeaderboard(50);
  const topThree = operators.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Top Breadcrumb & Nav */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1f3352]">
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-[#9fef00] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Community Discussions
        </Link>
        <span className="text-xs font-mono text-slate-500 flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-[#ff8400]" /> Season 1 • Real-time Sync
        </span>
      </div>

      {/* Hero Banner */}
      <div className="relative p-6 sm:p-8 rounded-2xl border border-[#1f3352] bg-gradient-to-r from-[#111d30] via-[#14233c] to-[#0b121e] overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#9fef00]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-2 text-xs font-mono text-[#9fef00]">
          <Trophy className="w-4 h-4" />
          <span>CYBERVAULT OPERATOR HALL OF FAME</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 font-mono tracking-tight">
          OPERATOR LEADERBOARD & REPUTATION
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-sans leading-relaxed">
          Points are awarded for verified vulnerability disclosures, published offensive research, lab walkthroughs, tactical cheat sheets, and verified peer solutions.
        </p>

        {/* Reputation Scoring Formula Pill Highlights */}
        <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-[#0b121e] border border-[#ff3366]/40 text-[#ff3366] font-bold">
            +{REPUTATION_WEIGHTS.CVE_RECORD} CVE Disclosed
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#0b121e] border border-[#9fef00]/40 text-[#9fef00] font-bold">
            +{REPUTATION_WEIGHTS.ARTICLE} Research Paper
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#0b121e] border border-[#9fef00]/30 text-slate-200">
            +{REPUTATION_WEIGHTS.WRITEUP} Lab Writeup
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#0b121e] border border-[#2de2e6]/40 text-[#2de2e6]">
            +{REPUTATION_WEIGHTS.KNOWLEDGE_DOC} Tactical KB
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#0b121e] border border-amber-500/40 text-amber-400">
            +{REPUTATION_WEIGHTS.DISCUSSION_REPLY} Peer Solution
          </span>
        </div>
      </div>

      {/* Rank Tiers Legend */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-[#9fef00]" />
          <span>OPERATOR RANK TIERS</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono text-xs">
          {RANK_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`p-3 rounded-xl border bg-[#111d30]/70 flex flex-col justify-between space-y-1.5 ${tier.badgeClass} ${tier.glowClass}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{tier.icon}</span>
                <span className="text-[10px] text-slate-400">{tier.minPoints}+ pts</span>
              </div>
              <div>
                <span className="font-bold block text-slate-100">{tier.title}</span>
                <span className="text-[10px] opacity-80 uppercase">{tier.name} TIER</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Podium: Top 3 Operators */}
      {topThree.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-[#9fef00]" />
            <span>TOP PODIUM OPERATORS</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topThree.map((op, idx) => {
              const placeStyles = [
                "border-[#9fef00]/60 bg-gradient-to-b from-[#14233c] to-[#111d30] shadow-[0_0_25px_rgba(159,239,0,0.15)] order-1 md:order-2 md:-translate-y-2",
                "border-slate-400/50 bg-[#111d30]/90 order-2 md:order-1",
                "border-amber-600/50 bg-[#111d30]/90 order-3 md:order-3",
              ];
              const medals = ["🥇 1ST PLACE", "🥈 2ND PLACE", "🥉 3RD PLACE"];

              return (
                <div
                  key={op.id}
                  className={`p-6 rounded-2xl border transition-all flex flex-col justify-between space-y-4 relative ${placeStyles[idx]}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#0b121e] border border-[#1f3352] text-[#9fef00]">
                      {medals[idx]}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${op.rank.badgeClass}`}>
                      {op.rank.icon} {op.rank.title}
                    </span>
                  </div>

                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 mx-auto rounded-full bg-[#0b121e] border-2 border-[#9fef00] flex items-center justify-center text-xl font-bold font-mono text-[#9fef00] shadow-[0_0_15px_rgba(159,239,0,0.25)]">
                      {op.name.charAt(0)}
                    </div>
                    <h4 className="text-lg font-bold text-slate-100 font-mono">{op.name}</h4>
                    <span className="text-xs font-mono text-slate-400 block">{op.primaryBadge}</span>
                    <div className="text-2xl font-extrabold text-[#9fef00] font-mono">
                      {op.points.toLocaleString()} <span className="text-xs text-slate-400">PTS</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1 pt-3 border-t border-[#1f3352]/70 text-center font-mono text-[10px]">
                    <div className="bg-[#0b121e] p-1.5 rounded">
                      <span className="block text-slate-500">CVEs</span>
                      <span className="font-bold text-[#ff3366]">{op.stats.cves}</span>
                    </div>
                    <div className="bg-[#0b121e] p-1.5 rounded">
                      <span className="block text-slate-500">Labs</span>
                      <span className="font-bold text-[#9fef00]">{op.stats.writeups}</span>
                    </div>
                    <div className="bg-[#0b121e] p-1.5 rounded">
                      <span className="block text-slate-500">Papers</span>
                      <span className="font-bold text-slate-200">{op.stats.articles}</span>
                    </div>
                    <div className="bg-[#0b121e] p-1.5 rounded">
                      <span className="block text-slate-500">Replies</span>
                      <span className="font-bold text-[#2de2e6]">{op.stats.replies}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#1f3352] pb-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[#9fef00]" />
            <span>ALL RANKED OPERATORS ({operators.length})</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            Updated hourly • Verified cryptographic identity
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#1f3352] bg-[#111d30]/80">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#0b121e] text-slate-400 border-b border-[#1f3352] text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Rank Tier</th>
                <th className="py-3 px-4">Specialization</th>
                <th className="py-3 px-4 text-center">CVEs</th>
                <th className="py-3 px-4 text-center">Write-ups</th>
                <th className="py-3 px-4 text-center">Papers</th>
                <th className="py-3 px-4 text-center">Solutions</th>
                <th className="py-3 px-4 text-right">Reputation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f3352]/60">
              {operators.map((op, index) => (
                <tr
                  key={op.id}
                  className="hover:bg-[#14233c]/70 transition-colors"
                >
                  <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#0b121e] border border-[#1f3352] flex items-center justify-center text-xs font-bold text-[#9fef00]">
                        {op.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-100 block">{op.name}</span>
                        <span className="text-[10px] text-slate-500 font-sans">
                          Joined {new Date(op.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${op.rank.badgeClass}`}>
                      <span>{op.rank.icon}</span>
                      <span>{op.rank.title}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-slate-300 text-[11px]">{op.primaryBadge}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-[#ff3366]">
                    {op.stats.cves}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-[#9fef00]">
                    {op.stats.writeups}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-200">
                    {op.stats.articles}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-[#2de2e6]">
                    {op.stats.replies}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-bold text-[#9fef00] text-sm">
                      {op.points.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1">pts</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
