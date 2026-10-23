import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { parseMarkdown } from "@/lib/markdown/renderer";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

export default async function ArticlePrintPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = await db.article.findUnique({
    where: { slug },
    include: { author: true, category: true, tags: { include: { tag: true } } },
  });

  if (!article) notFound();

  const { html, toc } = parseMarkdown(article.content);

  return (
    <div className="bg-white text-zinc-900 min-h-screen py-10 px-8 max-w-4xl mx-auto font-sans">
      {/* Print Controls (hidden when printing) */}
      <div className="no-print flex items-center justify-between pb-6 mb-8 border-b border-zinc-200">
        <Link
          href={`/articles/${article.slug}`}
          className="flex items-center gap-1.5 text-xs font-mono text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Article
        </Link>
        <button
          onClick={undefined}
          className="px-4 py-2 bg-zinc-900 text-white rounded text-xs font-mono font-bold flex items-center gap-2 hover:bg-zinc-800"
          id="trigger-print-btn"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      {/* Header */}
      <header className="border-b border-zinc-300 pb-6 mb-6">
        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">
          CyberVault Security Research Publication
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-950 mb-2 leading-tight">
          {article.title}
        </h1>
        {article.subtitle && (
          <p className="text-base text-zinc-600 italic mb-4">{article.subtitle}</p>
        )}
        <div className="text-xs font-mono text-zinc-600 flex items-center gap-4">
          <span>Author: {article.author.name}</span>
          <span>Date: {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : "Draft"}</span>
          <span>Category: {article.category?.name || "General"}</span>
        </div>
      </header>

      {/* Table of contents */}
      {toc.length > 0 && (
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded mb-8">
          <h2 className="text-xs font-mono font-bold text-zinc-700 uppercase tracking-wider mb-2">
            Index & Table of Contents
          </h2>
          <ul className="space-y-1 text-xs font-mono text-zinc-600">
            {toc.map((item) => (
              <li key={item.id} className={item.level === 3 ? "pl-4" : ""}>
                • {item.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Article Content */}
      <main
        className="article-prose print-content text-zinc-800 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Footer */}
      <footer className="mt-16 pt-6 border-t border-zinc-300 text-xs text-zinc-500 font-mono flex justify-between">
        <span>CyberVault Research — Verified Security Intelligence</span>
        <span>Page document: {article.slug}</span>
      </footer>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('trigger-print-btn')?.addEventListener('click', function() {
              window.print();
            });
          `,
        }}
      />
    </div>
  );
}
