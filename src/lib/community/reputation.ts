import { db } from "@/lib/db";

export const REPUTATION_WEIGHTS = {
  CVE_RECORD: 100,
  ARTICLE: 75,
  WRITEUP: 50,
  KNOWLEDGE_DOC: 40,
  DISCUSSION_REPLY: 15,
  DISCUSSION: 10,
  COMMENT: 5,
};

export interface RankTier {
  name: string;
  title: string;
  minPoints: number;
  color: string;
  badgeClass: string;
  glowClass: string;
  icon: string;
}

export const RANK_TIERS: RankTier[] = [
  {
    name: "OMNISCIENT",
    title: "Omniscient 0-Day",
    minPoints: 1000,
    color: "#ff3366",
    badgeClass: "bg-red-950/80 text-[#ff3366] border-[#ff3366]/50",
    glowClass: "shadow-[0_0_12px_rgba(255,51,102,0.35)]",
    icon: "👑",
  },
  {
    name: "ELITE",
    title: "SecOps Elite",
    minPoints: 500,
    color: "#9fef00",
    badgeClass: "bg-[#14233c] text-[#9fef00] border-[#9fef00]/50",
    glowClass: "shadow-[0_0_12px_rgba(159,239,0,0.3)]",
    icon: "🛡️",
  },
  {
    name: "PRO",
    title: "Pro Hacker",
    minPoints: 250,
    color: "#2de2e6",
    badgeClass: "bg-cyan-950/60 text-[#2de2e6] border-[#2de2e6]/50",
    glowClass: "shadow-[0_0_12px_rgba(45,226,230,0.3)]",
    icon: "⚡",
  },
  {
    name: "OPERATOR",
    title: "Field Operator",
    minPoints: 100,
    color: "#ff8400",
    badgeClass: "bg-amber-950/60 text-[#ff8400] border-[#ff8400]/50",
    glowClass: "shadow-[0_0_12px_rgba(255,132,0,0.25)]",
    icon: "🔧",
  },
  {
    name: "INITIATE",
    title: "Security Initiate",
    minPoints: 0,
    color: "#8ba0c3",
    badgeClass: "bg-slate-900/80 text-slate-400 border-[#1f3352]",
    glowClass: "",
    icon: "🔰",
  },
];

export function getRankFromPoints(points: number): RankTier {
  for (const tier of RANK_TIERS) {
    if (points >= tier.minPoints) {
      return tier;
    }
  }
  return RANK_TIERS[RANK_TIERS.length - 1];
}

export interface OperatorStats {
  cves: number;
  articles: number;
  writeups: number;
  kbDocs: number;
  replies: number;
  discussions: number;
  comments: number;
}

export function computePoints(stats: OperatorStats): number {
  return (
    stats.cves * REPUTATION_WEIGHTS.CVE_RECORD +
    stats.articles * REPUTATION_WEIGHTS.ARTICLE +
    stats.writeups * REPUTATION_WEIGHTS.WRITEUP +
    stats.kbDocs * REPUTATION_WEIGHTS.KNOWLEDGE_DOC +
    stats.replies * REPUTATION_WEIGHTS.DISCUSSION_REPLY +
    stats.discussions * REPUTATION_WEIGHTS.DISCUSSION +
    stats.comments * REPUTATION_WEIGHTS.COMMENT
  );
}

export interface OperatorLeaderboardEntry {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  createdAt: Date;
  points: number;
  rank: RankTier;
  stats: OperatorStats;
  primaryBadge: string;
}

export async function getLeaderboard(limit = 20): Promise<OperatorLeaderboardEntry[]> {
  const users = await db.user.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      role: true,
      avatar: true,
      createdAt: true,
      _count: {
        select: {
          cveRecords: true,
          articles: true,
          writeups: true,
          knowledgeDocs: true,
          discussionReplies: true,
          discussions: true,
          comments: true,
        },
      },
    },
  });

  const entries: OperatorLeaderboardEntry[] = users.map((u) => {
    const stats: OperatorStats = {
      cves: u._count.cveRecords,
      articles: u._count.articles,
      writeups: u._count.writeups,
      kbDocs: u._count.knowledgeDocs,
      replies: u._count.discussionReplies,
      discussions: u._count.discussions,
      comments: u._count.comments,
    };

    const points = computePoints(stats);
    const rank = getRankFromPoints(points);

    // Dynamic achievement badge based on primary contribution
    let primaryBadge = "Community Member";
    if (stats.cves > 0) primaryBadge = "CVE Researcher";
    else if (stats.writeups > 1) primaryBadge = "CTF Specialist";
    else if (stats.articles > 1) primaryBadge = "Lead Author";
    else if (stats.kbDocs > 0) primaryBadge = "Tactical Architect";
    else if (stats.replies > 2) primaryBadge = "Top Responder";

    return {
      id: u.id,
      name: u.name,
      role: u.role,
      avatar: u.avatar,
      createdAt: u.createdAt,
      points,
      rank,
      stats,
      primaryBadge,
    };
  });

  // Sort descending by points, then by replies/contributions
  entries.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.stats.replies - a.stats.replies;
  });

  return entries.slice(0, limit);
}
