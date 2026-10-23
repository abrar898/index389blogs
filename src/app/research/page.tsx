import Link from "next/link";
import { db } from "@/lib/db";
import { ShieldAlert, ArrowRight, Clock, User, Calendar, Terminal } from "lucide-react";

export const metadata = {
  title: "Vulnerability Research & Exploit Analysis",
  description: "Original security research publications, proof-of-concept breakdowns, and offensive telemetry.",
};

export default async function ResearchPage() {
  const researchArticles = await db.article.findMany({
    where: {
      status: "PUBLISHED",
      visibility: "PUBLIC",
      category: {
        slug: { in: ["vulnerability-research", "threat-intel"] },
      },
    },
    include: { author: true, category: true, tags: { include: { tag: true } } },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-[#1f3352] pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-[#9fef00] mb-2">
          <Terminal className="w-4 h-4" />
          <span>CYBERVAULT LABS — ORIGINAL SECURITY RESEARCH</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
          VULNERABILITY RESEARCH & POC ANALYSIS
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-2xl font-sans">
          Deep dives into memory safety, deserialization vulnerabilities, protocol reverse engineering, and threat actor tooling.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {researchArticles.map((article) => (
          <article
            key={article.id}
            className="p-6 rounded-xl border border-[#1f3352] bg-[#111d30]/90 hover:border-[#9fef00]/60 transition-all space-y-3 group shadow-xl"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#9fef00]/15 border border-[#9fef00]/40 text-[#9fef00] font-bold">
                {article.category?.name || "Research"}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : ""}
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-100 group-hover:text-[#9fef00] transition-colors">
              <Link href={`/articles/${article.slug}`}>{article.title}</Link>
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 font-sans">
              {article.summary}
            </p>

            <div className="pt-3 border-t border-[#1f3352] flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Author: {article.author.name}</span>
              <Link
                href={`/articles/${article.slug}`}
                className="text-[#9fef00] hover:text-white font-semibold flex items-center gap-1 transition-colors"
              >
                Read Paper <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
