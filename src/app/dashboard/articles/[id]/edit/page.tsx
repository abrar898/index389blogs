import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canEditArticle } from "@/lib/permissions/rbac";
import { ArticleEditor } from "@/components/editor/ArticleEditor";
import { ArrowLeft, History } from "lucide-react";

export const metadata = {
  title: "Edit Article — CyberVault",
};

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect(`/login?redirectTo=/dashboard/articles/${id}/edit`);
  }

  const article = await db.article.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      revisions: { orderBy: { version: "desc" }, take: 5 },
    },
  });

  if (!article) notFound();

  if (!canEditArticle(currentUser, article.authorId)) {
    redirect("/dashboard/articles");
  }

  const categories = await db.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const tagString = article.tags.map((t) => t.tag.name).join(", ");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Top back & revisions notice */}
      <div className="flex items-center justify-between pb-2">
        <Link
          href="/dashboard/articles"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-[#9fef00] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Articles
        </Link>

        <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
          <History className="w-3.5 h-3.5" /> {article.revisions.length} Revisions Recorded
        </span>
      </div>

      <ArticleEditor
        initialData={{
          id: article.id,
          title: article.title,
          slug: article.slug,
          subtitle: article.subtitle,
          summary: article.summary,
          content: article.content,
          categoryId: article.categoryId,
          status: article.status,
          visibility: article.visibility,
          isFeatured: article.isFeatured,
          tags: tagString,
        }}
        categories={categories}
        actionUrl={`/api/articles/${article.id}/update`}
      />
    </div>
  );
}
