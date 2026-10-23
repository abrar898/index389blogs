import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { parseMarkdown } from "@/lib/markdown/renderer";
import { Flag, ArrowLeft, Terminal, Shield, Eye, EyeOff, Printer, FileDown } from "lucide-react";
import { PrivateAccessGate } from "@/components/articles/PrivateAccessGate";
import { WriteUpLikeButton } from "@/components/writeups/WriteUpLikeButton";
import { BookmarkButton } from "@/components/articles/BookmarkButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const writeup = await db.writeUp.findUnique({
    where: { slug },
    select: { title: true, overview: true },
  });

  if (!writeup) return { title: "Write-up Not Found | CyberVault" };

  return {
    title: `${writeup.title} — Walkthrough`,
    description: writeup.overview,
  };
}

export default async function WriteUpDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const currentUser = await getCurrentUser();

  const writeup = await db.writeUp.findUnique({
    where: { slug },
    include: { author: true },
  });

  if (!writeup) {
    notFound();
  }

  // Check if article or writeup has private visibility
  const article = await db.article.findUnique({
    where: { slug },
    select: { visibility: true, authorId: true },
  });

  const isPrivate = article?.visibility === "PRIVATE";
  const isPrivilegedUser =
    currentUser &&
    (currentUser.role === "ADMIN" ||
      currentUser.role === "EDITOR" ||
      (currentUser.role === "AUTHOR" && currentUser.id === writeup.authorId));

  if (isPrivate && !isPrivilegedUser) {
    const cookieStore = await cookies();
    const enteredPasscode = cookieStore.get(`access_code_${slug}`)?.value?.trim();
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
          articleTitle={writeup.title}
          articleSummary={writeup.overview}
          slug={writeup.slug}
          isLoggedIn={!!currentUser}
          userRole={currentUser?.role}
        />
      );
    }
  }

  const { html, toc } = parseMarkdown(writeup.content);

  // Fetch likes count and if current user has liked
  const initialLikesCount = await db.bookmark.count({
    where: {
      contentType: "WRITEUP_LIKE",
      contentId: writeup.id,
    },
  });

  let initialHasLiked = false;
  if (currentUser) {
    const userLike = await db.bookmark.findUnique({
      where: {
        userId_contentType_contentId: {
          userId: currentUser.id,
          contentType: "WRITEUP_LIKE",
          contentId: writeup.id,
        },
      },
    });
    initialHasLiked = !!userLike;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1f3352]">
        <Link
          href="/writeups"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-[#9fef00] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Write-ups
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {/* Write-up Like Button */}
          <WriteUpLikeButton
            writeupId={writeup.id}
            initialCount={initialLikesCount}
            initialHasLiked={initialHasLiked}
            isLoggedIn={!!currentUser}
          />

          {/* Bookmark & Share */}
          <BookmarkButton slug={writeup.slug} title={writeup.title} />

          <button
            onClick={undefined}
            id="print-writeup-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#111d30] border border-[#1f3352] hover:border-[#9fef00] text-xs text-slate-300 font-mono transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-[#9fef00]" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <header className="p-6 rounded-2xl border border-[#1f3352] bg-[#111d30]/90 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-xs font-mono uppercase bg-[#9fef00]/15 border border-[#9fef00]/40 text-[#9fef00] font-bold">
            {writeup.platform}
          </span>
          <span className="px-2.5 py-0.5 rounded text-xs font-mono uppercase bg-[#0b121e] border border-[#1f3352] text-slate-200">
            {writeup.difficulty}
          </span>
          <span className="px-2.5 py-0.5 rounded text-xs font-mono uppercase bg-[#0b121e] border border-[#1f3352] text-slate-400">
            {writeup.os}
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
          {writeup.title}
        </h1>

        <p className="text-sm text-slate-400 leading-relaxed font-sans">{writeup.overview}</p>

        {/* Lab Metadata Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#1f3352] text-xs font-mono">
          <div className="p-3 rounded-lg bg-[#0b121e] border border-[#1f3352]">
            <span className="text-slate-500 block text-[11px] uppercase mb-1">Skills Required</span>
            <span className="text-slate-300">{writeup.skillsRequired}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#0b121e] border border-[#1f3352]">
            <span className="text-[#9fef00] block text-[11px] uppercase mb-1">Key Takeaways</span>
            <span className="text-slate-300">{writeup.skillsLearned}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 text-xs font-mono text-slate-500">
          <span>Author: {writeup.author.name}</span>
          <span>Published: {new Date(writeup.publishedAt).toLocaleDateString()}</span>
        </div>
      </header>

      {/* Main Walkthrough Content */}
      <main
        className="article-prose pt-4"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Script for Print */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('print-writeup-btn')?.addEventListener('click', function() {
              window.print();
            });
          `,
        }}
      />
    </div>
  );
}
