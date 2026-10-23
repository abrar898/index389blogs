import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { Search, ShieldAlert, Flag, BookOpen, FileText, MessageSquare, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Global Search — CyberVault",
  description: "Search across technical articles, CVE advisories, lab write-ups, knowledge base cheat sheets, and discussions.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;
  const currentUser = await getCurrentUser();

  const query = q?.trim() || "";

  let articles: any[] = [];
  let cves: any[] = [];
  let writeups: any[] = [];
  let kbDocs: any[] = [];
  let discussions: any[] = [];

  if (query.length > 0) {
    const shouldFetch = (t: string) => !type || type === "all" || type === t;

    const promises: Promise<any>[] = [];

    if (shouldFetch("articles")) {
      promises.push(
        db.article
          .findMany({
            where: {
              status: "PUBLISHED",
              visibility: "PUBLIC",
              OR: [
                { title: { contains: query } },
                { summary: { contains: query } },
                { content: { contains: query } },
              ],
            },
            take: 10,
            select: { id: true, title: true, slug: true, summary: true, readingTimeMinutes: true, publishedAt: true },
          })
          .then((res) => (articles = res))
      );
    }

    if (shouldFetch("cves")) {
      promises.push(
        db.cVERecord
          .findMany({
            where: {
              isPublished: true,
              OR: [
                { cveId: { contains: query } },
                { title: { contains: query } },
                { affectedProducts: { contains: query } },
                { summary: { contains: query } },
              ],
            },
            take: 10,
            select: { id: true, cveId: true, title: true, summary: true, cvssScore: true, severity: true },
          })
          .then((res) => (cves = res))
      );
    }

    if (shouldFetch("writeups")) {
      promises.push(
        db.writeUp
          .findMany({
            where: {
              status: "PUBLISHED",
              OR: [
                { title: { contains: query } },
                { machineName: { contains: query } },
                { overview: { contains: query } },
                { skillsRequired: { contains: query } },
              ],
            },
            take: 10,
            select: { id: true, title: true, slug: true, platform: true, difficulty: true, overview: true },
          })
          .then((res) => (writeups = res))
      );
    }

    if (shouldFetch("kb")) {
      promises.push(
        db.knowledgeDocument
          .findMany({
            where: {
              visibility: "PUBLIC",
              OR: [
                { title: { contains: query } },
                { content: { contains: query } },
                { folder: { contains: query } },
              ],
            },
            take: 10,
            select: { id: true, title: true, slug: true, folder: true, category: true },
          })
          .then((res) => (kbDocs = res))
      );
    }

    if (shouldFetch("community")) {
      promises.push(
        db.discussion
          .findMany({
            where: {
              OR: [
                { title: { contains: query } },
                { content: { contains: query } },
              ],
            },
            take: 10,
            select: { id: true, title: true, slug: true, category: true, createdAt: true },
          })
          .then((res) => (discussions = res))
      );
    }

    await Promise.all(promises);
  }

  const totalResults =
    articles.length + cves.length + writeups.length + kbDocs.length + discussions.length;

  const contentTypes = [
    { label: "All Content", value: "all" },
    { label: `Articles (${articles.length})`, value: "articles" },
    { label: `CVEs (${cves.length})`, value: "cves" },
    { label: `Write-ups (${writeups.length})`, value: "writeups" },
    { label: `Knowledge Base (${kbDocs.length})`, value: "kb" },
    { label: `Discussions (${discussions.length})`, value: "community" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Search Header Form */}
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono tracking-tight flex items-center gap-2">
          <Search className="w-6 h-6 text-[#9fef00]" />
          GLOBAL REPOSITORY SEARCH
        </h1>

        <form method="GET" className="relative flex items-center gap-2">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search CVE identifiers, tools, exploit techniques, commands, walkthroughs..."
            autoFocus
            className="w-full px-5 py-3 rounded-xl bg-[#0b121e] border border-[#1f3352] text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#9fef00] shadow-inner"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#9fef00] hover:bg-[#b0ff1a] text-[#0b121e] font-bold text-xs font-mono uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(159,239,0,0.3)]"
          >
            Search
          </button>
        </form>
      </div>

      {/* Content Type Filter */}
      {query && (
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono pb-2 border-b border-[#1f3352]">
          {contentTypes.map((ct) => {
            const isSelected = (!type && ct.value === "all") || type === ct.value;
            return (
              <Link
                key={ct.value}
                href={`/search?q=${encodeURIComponent(query)}&type=${ct.value}`}
                className={`px-3 py-1.5 rounded-lg border transition-colors ${
                  isSelected
                    ? "bg-[#9fef00]/15 border-[#9fef00] text-[#9fef00] font-bold"
                    : "bg-[#111d30] border-[#1f3352] text-slate-400 hover:text-white hover:border-slate-500"
                }`}
              >
                {ct.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Results */}
      {query ? (
        <div className="space-y-6">
          <p className="text-xs font-mono text-slate-500">
            Found {totalResults} result{totalResults === 1 ? "" : "s"} for "{query}"
          </p>

          {/* Articles */}
          {articles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#9fef00]" /> Articles & Tutorials
              </h3>
              {articles.map((a) => (
                <div key={a.id} className="p-4 rounded-lg border border-[#1f3352] bg-[#111d30]/70 hover:border-[#9fef00]/40 transition-colors space-y-1">
                  <Link href={`/articles/${a.slug}`} className="text-sm font-bold text-slate-100 hover:text-[#9fef00] transition-colors">
                    {a.title}
                  </Link>
                  <p className="text-xs text-slate-400 line-clamp-2">{a.summary}</p>
                </div>
              ))}
            </div>
          )}

          {/* CVEs */}
          {cves.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#ff3366]" /> Vulnerability Advisories
              </h3>
              {cves.map((c) => (
                <div key={c.id} className="p-4 rounded-lg border border-[#1f3352] bg-[#111d30]/70 hover:border-[#ff3366]/40 transition-colors flex items-center justify-between">
                  <div>
                    <Link href={`/vulnerabilities/${c.cveId}`} className="text-sm font-mono font-bold text-[#9fef00] hover:underline">
                      {c.cveId}: {c.title}
                    </Link>
                    <p className="text-xs text-slate-400 line-clamp-1">{c.summary}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#ff3366]/15 text-[#ff3366] border border-[#ff3366]/40">
                    CVSS {c.cvssScore.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Write-ups */}
          {writeups.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-[#9fef00]" /> Lab Write-ups
              </h3>
              {writeups.map((w) => (
                <div key={w.id} className="p-4 rounded-lg border border-[#1f3352] bg-[#111d30]/70 hover:border-[#9fef00]/40 transition-colors space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="text-[#9fef00] uppercase font-bold">{w.platform}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">{w.difficulty}</span>
                  </div>
                  <Link href={`/writeups/${w.slug}`} className="text-sm font-bold text-slate-100 hover:text-[#9fef00] transition-colors">
                    {w.title}
                  </Link>
                  <p className="text-xs text-slate-400 line-clamp-1">{w.overview}</p>
                </div>
              ))}
            </div>
          )}

          {/* Knowledge Base */}
          {kbDocs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#9fef00]" /> Knowledge Base Notes
              </h3>
              {kbDocs.map((doc) => (
                <div key={doc.id} className="p-4 rounded-lg border border-[#1f3352] bg-[#111d30]/70 hover:border-[#9fef00]/40 transition-colors flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#9fef00] block">{doc.folder} / {doc.category}</span>
                    <Link href={`/knowledge/${doc.slug}`} className="text-sm font-bold text-slate-100 hover:text-[#9fef00]">
                      {doc.title}
                    </Link>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </div>
              ))}
            </div>
          )}

          {totalResults === 0 && (
            <div className="p-12 text-center rounded-xl border border-[#1f3352] bg-[#111d30]/40 font-mono text-xs text-slate-400">
              No results found matching "{query}". Try checking CVE IDs or alternative keywords.
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center rounded-xl border border-[#1f3352] bg-[#111d30]/40 space-y-3">
          <p className="text-xs font-mono text-slate-400">
            Type any query above to perform deep full-text search across all published technical intelligence.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs font-mono pt-2">
            <span className="text-slate-500">Popular queries:</span>
            <Link href="/search?q=Linux" className="text-[#9fef00] hover:underline">Linux</Link>
            <Link href="/search?q=Kerberos" className="text-[#9fef00] hover:underline">Kerberos</Link>
            <Link href="/search?q=CVE-2026" className="text-[#9fef00] hover:underline">CVE-2026</Link>
            <Link href="/search?q=SUID" className="text-[#9fef00] hover:underline">SUID</Link>
            <Link href="/search?q=Deserialization" className="text-[#9fef00] hover:underline">Deserialization</Link>
          </div>
        </div>
      )}
    </div>
  );
}
