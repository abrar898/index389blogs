import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { parseMarkdown } from "@/lib/markdown/renderer";
import { isUserSubscribed } from "@/lib/subscription";
import { BookOpen, ArrowLeft, Lock, Globe } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = await db.knowledgeDocument.findUnique({
    where: { slug },
    select: { title: true },
  });

  if (!doc) return { title: "Document Not Found | CyberVault" };

  return { title: `${doc.title} — Knowledge Base` };
}

export default async function KnowledgeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const currentUser = await getCurrentUser();

  const doc = await db.knowledgeDocument.findUnique({
    where: { slug },
    include: { author: true },
  });

  if (!doc) notFound();

  // Enforce private note isolation
  if (doc.visibility === "PRIVATE") {
    const isSubscriber = await isUserSubscribed(currentUser?.id);
    const hasAccess =
      (currentUser &&
        (currentUser.role === "ADMIN" || currentUser.id === doc.authorId)) ||
      isSubscriber;

    if (!hasAccess) {
      notFound();
    }
  }

  const { html } = parseMarkdown(doc.content);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button & Controls */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1f3352]">
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-300 hover:text-[#9fef00] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Knowledge Base
        </Link>

        <div className="flex items-center gap-2">
          {doc.visibility === "PRIVATE" ? (
            <span className="px-2.5 py-1 rounded bg-red-950/80 text-[#ff3366] border border-[#ff3366]/40 text-xs font-mono flex items-center gap-1.5 font-bold">
              <Lock className="w-3 h-3" /> Confidential Note
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded bg-[#111d30] text-slate-300 border border-[#1f3352] text-xs font-mono flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-[#2de2e6]" /> Public Documentation
            </span>
          )}
        </div>
      </div>

      {/* Header */}
      <header className="p-6 rounded-2xl border border-[#1f3352] bg-[#111d30] space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-[#9fef00] font-bold">
          <BookOpen className="w-4 h-4" />
          <span>{doc.folder} / {doc.category}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight font-mono">
          {doc.title}
        </h1>

        <div className="flex items-center justify-between pt-3 border-t border-[#1f3352] text-xs font-mono text-slate-400">
          <span>Author: {doc.author.name}</span>
          <span>Last modified: {new Date(doc.updatedAt).toLocaleDateString()}</span>
        </div>
      </header>

      {/* Document Content */}
      <main
        className="article-prose pt-4"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
