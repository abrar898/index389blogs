import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { ArticleEditor } from "@/components/editor/ArticleEditor";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "New Research Publication — CyberVault",
};

export default async function NewArticlePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || !["ADMIN", "EDITOR", "AUTHOR"].includes(currentUser.role)) {
    redirect("/login?redirectTo=/dashboard/articles/new");
  }

  const categories = await db.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link
        href="/dashboard/articles"
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-[#9fef00] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Article Console
      </Link>

      <ArticleEditor categories={categories} actionUrl="/api/articles/create" />
    </div>
  );
}
