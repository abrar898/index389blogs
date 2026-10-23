import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { parseMarkdown } from "@/lib/markdown/renderer";
import { MessageSquare, ArrowLeft, CheckCircle2, User, Lock } from "lucide-react";
import { BookmarkButton } from "@/components/articles/BookmarkButton";
import { computePoints, getRankFromPoints } from "@/lib/community/reputation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const discussion = await db.discussion.findUnique({
    where: { slug },
    select: { title: true },
  });

  if (!discussion) return { title: "Discussion Not Found | CyberVault" };

  return { title: `${discussion.title} — Community` };
}

export default async function DiscussionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const currentUser = await getCurrentUser();

  const authorCountSelect = {
    cveRecords: true,
    articles: true,
    writeups: true,
    knowledgeDocs: true,
    discussionReplies: true,
    discussions: true,
    comments: true,
  };

  const discussion = await db.discussion.findUnique({
    where: { slug },
    include: {
      author: {
        include: {
          _count: { select: authorCountSelect },
        },
      },
      replies: {
        include: {
          author: {
            include: {
              _count: { select: authorCountSelect },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!discussion) notFound();

  const { html } = parseMarkdown(discussion.content);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button and actions */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1f3352]">
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-[#9fef00] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Community Discussions
        </Link>
        <BookmarkButton slug={discussion.slug} title={discussion.title} />
      </div>

      {/* Main Discussion Post */}
      <article className="p-6 rounded-2xl border border-[#1f3352] bg-[#111d30]/90 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-[#9fef00]/15 border border-[#9fef00]/40 text-[#9fef00] uppercase font-bold">
              {discussion.category}
            </span>
            {discussion.isLocked && (
              <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-400 font-mono text-[10px] uppercase font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" /> LOCKED
              </span>
            )}
            <span className="text-slate-500">
              {new Date(discussion.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 leading-tight">
          {discussion.title}
        </h1>

        <div className="flex items-center gap-3 pt-2 pb-4 border-t border-[#1f3352]">
          <div className="w-8 h-8 rounded-full bg-[#0b121e] border border-[#1f3352] flex items-center justify-center font-mono font-bold text-[#9fef00] text-xs">
            {discussion.author.name.charAt(0)}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-slate-200">{discussion.author.name}</p>
              {(() => {
                const aStats = {
                  cves: discussion.author._count.cveRecords,
                  articles: discussion.author._count.articles,
                  writeups: discussion.author._count.writeups,
                  kbDocs: discussion.author._count.knowledgeDocs,
                  replies: discussion.author._count.discussionReplies,
                  discussions: discussion.author._count.discussions,
                  comments: discussion.author._count.comments,
                };
                const pts = computePoints(aStats);
                const r = getRankFromPoints(pts);
                return (
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${r.badgeClass}`}>
                    <span>{r.icon}</span>
                    <span>{r.title}</span>
                    <span className="opacity-70">({pts} pts)</span>
                  </span>
                );
              })()}
            </div>
            <p className="text-[10px] text-slate-500 font-mono">{discussion.author.role}</p>
          </div>
        </div>

        <div
          className="article-prose pt-2 text-sm text-slate-300"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>

      {/* Replies List */}
      <section className="space-y-4">
        <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#9fef00]" />
          Responses ({discussion.replies.length})
        </h2>

        {discussion.replies.map((reply) => {
          const rStats = {
            cves: reply.author._count.cveRecords,
            articles: reply.author._count.articles,
            writeups: reply.author._count.writeups,
            kbDocs: reply.author._count.knowledgeDocs,
            replies: reply.author._count.discussionReplies,
            discussions: reply.author._count.discussions,
            comments: reply.author._count.comments,
          };
          const pts = computePoints(rStats);
          const r = getRankFromPoints(pts);

          return (
            <div
              key={reply.id}
              className={`p-5 rounded-xl border space-y-2 ${
                reply.isAcceptedAnswer
                  ? "border-[#9fef00]/50 bg-[#9fef00]/5"
                  : "border-[#1f3352] bg-[#111d30]/70"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200">{reply.author.name}</span>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${r.badgeClass}`}>
                    <span>{r.icon}</span>
                    <span>{r.title}</span>
                  </span>
                  <span className="text-slate-500">
                    {new Date(reply.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {reply.isAcceptedAnswer && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#9fef00]/20 border border-[#9fef00]/50 text-[#9fef00] flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3 h-3" /> VERIFIED SOLUTION
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">{reply.content}</p>
            </div>
          );
        })}
      </section>

      {/* Reply Form */}
      {discussion.isLocked ? (
        <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-mono text-amber-300 flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>This discussion thread has been locked. New replies are disabled.</span>
        </div>
      ) : currentUser ? (
        <form
          action="/api/community/reply"
          method="POST"
          className="p-6 rounded-xl border border-[#1f3352] bg-[#111d30]/90 shadow-xl space-y-4"
        >
          <input type="hidden" name="discussionId" value={discussion.id} />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Post a Reply
          </h3>
          <textarea
            name="content"
            required
            rows={4}
            placeholder="Share your technical insight, methodology, or response..."
            className="w-full px-4 py-3 rounded-lg bg-[#0b121e] border border-[#1f3352] text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#9fef00] font-mono"
          ></textarea>

          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-[#9fef00] hover:bg-[#b0ff1a] text-[#0b121e] font-bold text-xs font-mono transition-colors shadow-[0_0_12px_rgba(159,239,0,0.3)]"
          >
            Submit Reply
          </button>
        </form>
      ) : (
        <div className="p-5 rounded-xl border border-[#1f3352] bg-[#111d30]/60 text-xs font-mono text-slate-400 flex items-center justify-between">
          <span>Sign in to reply to this discussion.</span>
          <Link href="/login" className="px-3 py-1.5 rounded bg-[#0b121e] border border-[#1f3352] hover:border-[#9fef00] text-[#9fef00] transition-colors">
            Sign In
          </Link>
        </div>
      )}
    </div>
  );
}
