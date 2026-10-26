import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { BookOpen, Folder, Star, Lock, Globe, Plus, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Cybersecurity Knowledge Base & Tactical Cheat Sheets",
  description: "Curated security documentation, Active Directory notes, Linux commands, and offensive cheat sheets.",
};

export default async function KnowledgeBasePage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const { folder } = await searchParams;
  const currentUser = await getCurrentUser();

  const whereClause: any = {
    OR: [
      { visibility: "PUBLIC" },
      ...(currentUser ? [{ authorId: currentUser.id }] : []),
    ],
  };

  if (folder) {
    whereClause.folder = folder;
  }

  const [docs, allFolders] = await Promise.all([
    db.knowledgeDocument.findMany({
      where: whereClause,
      include: { author: true },
      orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
    }),
    db.knowledgeDocument.groupBy({
      by: ["folder"],
      where: {
        OR: [
          { visibility: "PUBLIC" },
          ...(currentUser ? [{ authorId: currentUser.id }] : []),
        ],
      },
      _count: { id: true },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#1f3352] gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#9fef00] mb-2 font-bold">
            <BookOpen className="w-4 h-4" />
            <span>SECURITY KNOWLEDGE BASE & COMMAND REFERENCE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight flex items-center gap-2">
            <span className="text-[#9fef00]">{">"}</span> KNOWLEDGE BASE & CHEAT SHEETS
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-2xl font-sans">
            Modular, high-density technical notes covering Linux enumeration, Kerberos exploitation, Windows privesc, and web security references.
          </p>
        </div>

        {currentUser && (
          <Link
            href="/dashboard/knowledge/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#9fef00] hover:bg-[#b4fa1f] text-[#0b121e] font-bold text-xs font-mono transition-colors self-start sm:self-auto shadow-[0_0_15px_rgba(159,239,0,0.25)]"
          >
            <Plus className="w-4 h-4" /> New Doc / Note
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Folder Navigation */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-[#1f3352] bg-[#111d30] space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#9fef00] mb-2">
              Collections & Folders
            </h3>
            <ul className="space-y-1 text-xs font-mono">
              <li>
                <Link
                  href="/knowledge"
                  className={`flex items-center justify-between px-3 py-2 rounded transition-colors ${
                    !folder ? "bg-[#9fef00] text-[#0b121e] font-bold" : "text-slate-300 hover:text-white hover:bg-[#14233c]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Folder className="w-3.5 h-3.5" /> All Documents
                  </span>
                  <span className={`text-[10px] ${!folder ? "text-[#0b121e]" : "text-slate-400"}`}>
                    {allFolders.reduce((acc, f) => acc + f._count.id, 0)}
                  </span>
                </Link>
              </li>
              {allFolders.map((f) => (
                <li key={f.folder}>
                  <Link
                    href={`/knowledge?folder=${encodeURIComponent(f.folder)}`}
                    className={`flex items-center justify-between px-3 py-2 rounded transition-colors ${
                      folder === f.folder
                        ? "bg-[#9fef00] text-[#0b121e] font-bold"
                        : "text-slate-300 hover:text-white hover:bg-[#14233c]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Folder className="w-3.5 h-3.5" /> {f.folder}
                    </span>
                    <span className={`text-[10px] ${folder === f.folder ? "text-[#0b121e]" : "text-slate-400"}`}>
                      {f._count.id}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Documents List */}
        <div className="lg:col-span-3 space-y-4">
          {docs.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-[#1f3352] bg-[#111d30] font-mono text-xs text-slate-400">
              No documentation found in this folder.
            </div>
          ) : (
            docs.map((doc) => (
              <div
                key={doc.id}
                className="p-5 rounded-xl border border-[#1f3352] bg-[#111d30] hover:border-[#9fef00]/60 hover:shadow-[0_0_20px_rgba(159,239,0,0.1)] transition-all flex items-center justify-between group"
              >
                <div className="space-y-1.5 pr-4">
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-[#14233c] border border-[#9fef00]/30 text-[#9fef00] uppercase font-bold">
                      {doc.folder}
                    </span>
                    <span className="text-slate-400">{doc.category}</span>
                    {doc.isFavorite && (
                      <span className="text-[#9fef00] flex items-center gap-0.5 font-bold">
                        <Star className="w-3 h-3 fill-current" /> Favorite
                      </span>
                    )}
                    {doc.visibility === "PRIVATE" ? (
                      <span className="px-1.5 py-0.5 rounded bg-red-950/80 text-[#ff3366] border border-[#ff3366]/40 text-[9px] flex items-center gap-1 font-bold">
                        <Lock className="w-2.5 h-2.5" /> PRIVATE NOTE
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px] flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5 text-[#2de2e6]" /> Public
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-100 group-hover:text-[#9fef00] transition-colors font-mono">
                    <Link href={`/knowledge/${doc.slug}`}>{doc.title}</Link>
                  </h3>

                  <p className="text-xs text-slate-400 font-mono">
                    Updated {new Date(doc.updatedAt).toLocaleDateString()} by {doc.author.name}
                  </p>
                </div>

                <Link
                  href={`/knowledge/${doc.slug}`}
                  className="p-2.5 rounded-lg bg-[#14233c] hover:bg-[#1f3352] text-slate-300 group-hover:text-[#9fef00] transition-colors flex-shrink-0 border border-[#1f3352]"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
