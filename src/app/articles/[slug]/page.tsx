import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { parseMarkdown } from "@/lib/markdown/renderer";
import { canEditArticle } from "@/lib/permissions/rbac";
import { PrivateAccessGate } from "@/components/articles/PrivateAccessGate";
import { BookmarkButton } from "@/components/articles/BookmarkButton";
import {
  Clock,
  Calendar,
  User,
  ArrowLeft,
  FileDown,
  Printer,
  Edit,
  Tag,
  Share2,
  ExternalLink,
  GitBranch,
  Globe,
  MessageSquare,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await db.article.findUnique({
    where: { slug },
    select: { title: true, summary: true, seoTitle: true, seoDescription: true },
  });

  if (!article) return { title: "Article Not Found | CyberVault" };

  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.summary,
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const currentUser = await getCurrentUser();

  const article = await db.article.findUnique({
    where: { slug },
    include: {
      author: { include: { profile: true } },
      category: true,
      tags: { include: { tag: true } },
      comments: {
        where: { status: "APPROVED" },
        include: { author: true, replies: { include: { author: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!article) {
    notFound();
  }

  const cookieStore = await cookies();
  const enteredPasscode = cookieStore.get(`access_code_${slug}`)?.value?.trim();

  // Determine access privileges:
  const isPrivilegedUser =
    currentUser &&
    (currentUser.role === "ADMIN" ||
      currentUser.role === "EDITOR" ||
      (currentUser.role === "AUTHOR" && currentUser.id === article.authorId));

  // If unpublished draft/review and not privileged, block
  if (article.status !== "PUBLISHED" && !isPrivilegedUser) {
    notFound();
  }

  // If private article:
  // 1. Privileged users (ADMIN, EDITOR, AUTHOR of article) can see immediately
  // 2. Regular users or guests can view if they entered an accepted passcode
  // 3. Otherwise, render the interactive PrivateAccessGate passcode input box!
  if (article.visibility === "PRIVATE" && !isPrivilegedUser) {
    const validCodes = [
      "HTB",
      "htb",
      "cybervault",
      "admin",
      "layover",
      "flag",
      process.env.PRIVATE_ARTICLE_CODE?.toLowerCase(),
    ].filter(Boolean);

    const isCodeValid =
      enteredPasscode && validCodes.includes(enteredPasscode.toLowerCase());

    if (!isCodeValid) {
      return (
        <PrivateAccessGate
          articleTitle={article.title}
          articleSummary={article.summary}
          slug={article.slug}
          isLoggedIn={!!currentUser}
          userRole={currentUser?.role}
        />
      );
    }
  }

  const { html, toc, readingTimeMinutes } = parseMarkdown(article.content);

  const relatedArticles = article.categoryId
    ? await db.article.findMany({
        where: {
          categoryId: article.categoryId,
          id: { not: article.id },
          status: "PUBLISHED",
          visibility: "PUBLIC",
        },
        take: 3,
        select: { id: true, title: true, slug: true, readingTimeMinutes: true },
      })
    : [];

  const userCanEdit = canEditArticle(currentUser, article.authorId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button & Admin Actions */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-[#1f3352]">
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-300 hover:text-[#9fef00] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Articles
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {/* Save / Share */}
          <BookmarkButton slug={article.slug} title={article.title} />

          {/* DOCX Export */}
          <a
            href={`/api/export/docx?slug=${article.slug}`}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#111d30] border border-[#1f3352] hover:border-[#9fef00]/60 text-xs text-slate-200 font-mono transition-colors"
            title="Download Word Document"
          >
            <FileDown className="w-3.5 h-3.5 text-[#9fef00]" />
            <span className="hidden sm:inline">Export DOCX</span>
          </a>

          {/* Print / PDF view */}
          <Link
            href={`/articles/${article.slug}/print`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#111d30] border border-[#1f3352] hover:border-[#9fef00]/60 text-xs text-slate-200 font-mono transition-colors"
            title="Print-friendly PDF format"
          >
            <Printer className="w-3.5 h-3.5 text-[#2de2e6]" />
            <span className="hidden sm:inline">PDF / Print</span>
          </Link>

          {/* Edit button */}
          {userCanEdit && (
            <Link
              href={`/dashboard/articles/${article.id}/edit`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#9fef00] text-[#0b121e] hover:bg-[#b4fa1f] text-xs font-mono font-bold transition-colors shadow-[0_0_12px_rgba(159,239,0,0.25)]"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Main Article Body (3 cols) */}
        <div className="lg:col-span-3 space-y-8">
          {/* Header Metadata */}
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {article.category && (
                <span className="px-2.5 py-0.5 rounded text-xs font-mono uppercase bg-[#14233c] border border-[#9fef00]/30 text-[#9fef00] font-bold">
                  {article.category.name}
                </span>
              )}
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#9fef00]" /> {article.readingTimeMinutes || readingTimeMinutes} min read
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Unpublished"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight font-mono">
              {article.title}
            </h1>

            {article.subtitle && (
              <p className="text-base text-slate-300 leading-relaxed font-sans">
                {article.subtitle}
              </p>
            )}

            {/* Author bar */}
            <div className="flex items-center gap-3 pt-3 border-t border-[#1f3352]">
              <div className="w-9 h-9 rounded-full bg-[#111d30] border border-[#1f3352] flex items-center justify-center font-mono font-bold text-[#9fef00] text-sm">
                {article.author.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200 font-mono">{article.author.name}</p>
                <p className="text-[11px] text-slate-400 font-mono">{article.author.role}</p>
              </div>
            </div>
          </header>

          {/* Rendered HTML */}
          <div
            className="article-prose border-t border-[#1f3352] pt-6"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* Tags */}
          <div className="pt-8 border-t border-[#1f3352] flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-400 mr-2 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#9fef00]" /> TAGS:
            </span>
            {article.tags.map((t) => (
              <Link
                key={t.tag.id}
                href={`/articles?tag=${t.tag.slug}`}
                className="px-2.5 py-1 rounded bg-[#111d30] border border-[#1f3352] hover:border-[#9fef00]/60 text-xs font-mono text-slate-300 hover:text-[#9fef00] transition-colors"
              >
                #{t.tag.name}
              </Link>
            ))}
          </div>

          {/* Comments Section */}
          <section className="pt-10 border-t border-[#1f3352] space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#9fef00]" />
                PEER REVIEW & COMMENTS ({article.comments.length})
              </h3>
            </div>

            {/* Post comment form */}
            {currentUser ? (
              <form action="/api/comments" method="POST" className="space-y-3 p-4 rounded-xl border border-[#1f3352] bg-[#111d30]">
                <input type="hidden" name="articleId" value={article.id} />
                <label className="block text-xs font-mono text-slate-300">
                  Comment as <span className="text-[#9fef00] font-bold">{currentUser.name}</span>:
                </label>
                <textarea
                  name="content"
                  required
                  rows={3}
                  placeholder="Contribute technical feedback, verification notes, or questions..."
                  className="w-full px-3 py-2 rounded-lg bg-[#0b121e] border border-[#1f3352] text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#9fef00] font-mono"
                ></textarea>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#9fef00] hover:bg-[#b4fa1f] text-[#0b121e] text-xs font-bold font-mono transition-colors shadow-[0_0_12px_rgba(159,239,0,0.25)]"
                >
                  Post Comment
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-lg border border-[#1f3352] bg-[#111d30] text-xs text-slate-300 font-mono flex items-center justify-between">
                <span>Sign in to participate in the peer review discussion.</span>
                <Link href="/login" className="px-3 py-1 rounded bg-[#14233c] hover:bg-[#1f3352] text-[#9fef00] border border-[#1f3352]">
                  Sign In
                </Link>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {article.comments.length === 0 ? (
                <p className="text-xs text-slate-400 font-mono">No comments posted yet. Be the first to review this research.</p>
              ) : (
                article.comments.map((comment) => (
                  <div key={comment.id} className="p-4 rounded-lg border border-[#1f3352] bg-[#111d30] space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span className="font-bold text-[#9fef00]">{comment.author.name}</span>
                      <span className="text-slate-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">{comment.content}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Sticky Sidebar (1 col) */}
        <div className="space-y-8">
          {/* Table of Contents */}
          {toc.length > 0 && (
            <div className="sticky top-24 p-5 rounded-xl border border-[#1f3352] bg-[#111d30] space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#9fef00]">
                Table of Contents
              </h3>
              <nav className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-2">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`block text-xs text-slate-400 hover:text-[#9fef00] transition-colors font-mono ${
                      item.level === 3 ? "pl-3 text-slate-500" : ""
                    }`}
                  >
                    {item.text}
                  </a>
                ))}
              </nav>
            </div>
          )}

          {/* Author Card */}
          <div className="p-5 rounded-xl border border-[#1f3352] bg-[#111d30] space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#9fef00]">
              About the Researcher
            </h3>
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-100 font-mono">{article.author.name}</p>
              {article.author.bio && (
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{article.author.bio}</p>
              )}
              {article.author.profile && (
                <div className="flex items-center gap-3 pt-2 text-slate-400">
                  {article.author.profile.website && (
                    <a
                      href={article.author.profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#9fef00] transition-colors"
                      title="Website"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                  {article.author.profile.github && (
                    <a
                      href={article.author.profile.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#9fef00] transition-colors"
                      title="GitHub"
                    >
                      <GitBranch className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="p-5 rounded-xl border border-[#1f3352] bg-[#111d30] space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#9fef00]">
                Related Research
              </h3>
              <div className="space-y-3">
                {relatedArticles.map((rel) => (
                  <div key={rel.id} className="space-y-1">
                    <Link
                      href={`/articles/${rel.slug}`}
                      className="text-xs font-bold text-slate-200 hover:text-[#9fef00] transition-colors line-clamp-2 font-mono"
                    >
                      {rel.title}
                    </Link>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {rel.readingTimeMinutes} min read
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
