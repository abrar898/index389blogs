import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { FileText, Plus, Edit, ExternalLink, Calendar, Clock, Eye } from "lucide-react";

export const metadata = {
  title: "Article Management Console — CyberVault",
};

export default async function DashboardArticlesPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || !["ADMIN", "EDITOR", "AUTHOR"].includes(currentUser.role)) {
    redirect("/login?redirectTo=/dashboard/articles");
  }

  // Admins & Editors can view all articles; Authors view their own
  const whereClause: any =
    currentUser.role === "ADMIN" || currentUser.role === "EDITOR"
      ? {}
      : { authorId: currentUser.id };

  const articles = await db.article.findMany({
    where: whereClause,
    include: { author: true, category: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#1f3352] gap-4">
        <div>
          <h1 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#9fef00]" />
            ARTICLE & PUBLISHING CONSOLE
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Manage drafts, schedule publications, review revisions, and update editorial metadata.
          </p>
        </div>

        <Link
          href="/dashboard/articles/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#9fef00] hover:bg-[#b0ff1a] text-[#0b121e] font-bold text-xs font-mono transition-colors self-start sm:self-auto shadow-[0_0_15px_rgba(159,239,0,0.3)]"
        >
          <Plus className="w-4 h-4" /> New Article
        </Link>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#1f3352] bg-[#111d30]/90 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0b121e] border-b border-[#1f3352] text-slate-400 uppercase">
              <tr>
                <th className="p-4">Title & Slug</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4">Visibility</th>
                <th className="p-4">Author</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f3352]">
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No articles found. Click "New Article" above to draft your first publication.
                  </td>
                </tr>
              ) : (
                articles.map((article) => (
                  <tr key={article.id} className="hover:bg-[#14233c] transition-colors">
                    <td className="p-4 max-w-sm">
                      <p className="font-bold text-slate-100 truncate">{article.title}</p>
                      <span className="text-[11px] text-slate-500 block truncate">/{article.slug}</span>
                    </td>

                    <td className="p-4">
                      <span className="text-slate-400">{article.category?.name || "General"}</span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          article.status === "PUBLISHED"
                            ? "bg-[#9fef00]/15 border border-[#9fef00]/40 text-[#9fef00]"
                            : article.status === "DRAFT"
                            ? "bg-[#0b121e] border border-[#1f3352] text-slate-400"
                            : "bg-[#2de2e6]/15 border border-[#2de2e6]/40 text-[#2de2e6]"
                        }`}
                      >
                        {article.status}
                      </span>
                    </td>

                    <td className="p-4 text-slate-400">{article.visibility}</td>

                    <td className="p-4 text-slate-400">{article.author.name}</td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/articles/${article.slug}`}
                          className="p-1.5 rounded hover:bg-[#0b121e] text-slate-400 hover:text-[#9fef00] transition-colors"
                          title="View Live Article"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/dashboard/articles/${article.id}/edit`}
                          className="p-1.5 rounded hover:bg-[#0b121e] text-slate-400 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
