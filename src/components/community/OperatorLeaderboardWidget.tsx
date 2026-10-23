import Link from "next/link";
import { Trophy, Award, ArrowRight, ShieldCheck, Flame } from "lucide-react";
import { OperatorLeaderboardEntry } from "@/lib/community/reputation";

interface OperatorLeaderboardWidgetProps {
  topOperators: OperatorLeaderboardEntry[];
}

export function OperatorLeaderboardWidget({
  topOperators,
}: OperatorLeaderboardWidgetProps) {
  const getMedal = (index: number) => {
    switch (index) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return `#${index + 1}`;
    }
  };

  return (
    <div className="p-5 rounded-xl border border-[#1f3352] bg-[#111d30]/90 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-[#1f3352] pb-3">
        <h3 className="text-xs font-mono font-bold tracking-wider text-slate-100 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#9fef00]" />
          <span>TOP OPERATORS</span>
        </h3>
        <Link
          href="/community/leaderboard"
          className="text-[11px] font-mono text-[#9fef00] hover:underline flex items-center gap-1 font-semibold"
        >
          Leaderboard <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2.5">
        {topOperators.slice(0, 5).map((op, idx) => (
          <div
            key={op.id}
            className="p-2.5 rounded-lg border border-[#1f3352]/70 bg-[#0b121e]/80 hover:bg-[#14233c] hover:border-[#9fef00]/40 transition-all flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="font-mono font-bold text-xs w-5 text-center text-slate-400">
                {getMedal(idx)}
              </span>

              <div className="w-7 h-7 rounded-full bg-[#111d30] border border-[#1f3352] flex items-center justify-center text-xs font-bold font-mono text-[#9fef00]">
                {op.name.charAt(0)}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-100 group-hover:text-[#9fef00] transition-colors truncate font-mono">
                    {op.name}
                  </span>
                </div>
                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${op.rank.badgeClass} ${op.rank.glowClass}`}>
                  {op.rank.icon} {op.rank.title}
                </span>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <span className="font-mono text-xs font-bold text-[#9fef00] block">
                {op.points.toLocaleString()} <span className="text-[10px] text-slate-400">pts</span>
              </span>
              <span className="text-[9px] font-mono text-slate-500">
                {op.primaryBadge}
              </span>
            </div>
          </div>
        ))}

        {topOperators.length === 0 && (
          <p className="text-xs font-mono text-slate-500 text-center py-3">
            No ranked operators yet.
          </p>
        )}
      </div>

      <div className="pt-2 border-t border-[#1f3352]/50 text-[10px] font-mono text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Flame className="w-3 h-3 text-[#ff8400]" /> Season 1 Live
        </span>
        <Link
          href="/community/leaderboard"
          className="text-[#9fef00] hover:underline font-bold"
        >
          View all ranks &rarr;
        </Link>
      </div>
    </div>
  );
}
