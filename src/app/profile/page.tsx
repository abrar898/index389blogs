import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserSubscriptionDetails } from "@/lib/subscription";
import { User, Shield, BookOpen, Flag, FileText, Globe, GitBranch, LogOut, ArrowRight, CreditCard, Sparkles, Zap } from "lucide-react";

export const metadata = {
  title: "Operator Profile & Dashboard — CyberVault",
};

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?redirectTo=/profile");
  }

  const subDetails = await getUserSubscriptionDetails(currentUser.id);

  const user = await db.user.findUnique({
    where: { id: currentUser.id },
    include: {
      profile: true,
      articles: {
        orderBy: { updatedAt: "desc" },
        take: 5,
      },
      writeups: {
        take: 5,
        orderBy: { updatedAt: "desc" },
      },
      knowledgeDocs: {
        take: 5,
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Profile Header */}
      <div className="p-8 rounded-2xl border border-[#1f3352] bg-[#111d30]/90 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#0b121e] border border-[#1f3352] flex items-center justify-center font-mono font-bold text-2xl text-[#9fef00] shadow-[0_0_15px_rgba(159,239,0,0.2)]">
            {user.name.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-mono text-slate-100">{user.name}</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#9fef00]/15 border border-[#9fef00]/40 text-[#9fef00] uppercase font-bold">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">{user.email}</p>
            {user.bio && <p className="text-xs text-slate-300 max-w-xl font-sans">{user.bio}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {["ADMIN", "EDITOR", "AUTHOR"].includes(user.role) && (
            <Link
              href="/dashboard/articles/new"
              className="px-4 py-2 rounded-lg bg-[#9fef00] hover:bg-[#b0ff1a] text-[#0b121e] text-xs font-mono font-bold transition-colors shadow-[0_0_15px_rgba(159,239,0,0.3)]"
            >
              Write Article
            </Link>
          )}
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="px-4 py-2 rounded-lg bg-[#0b121e] hover:bg-[#1f3352] border border-[#1f3352] text-slate-200 text-xs font-mono font-semibold transition-colors"
            >
              Admin Console
            </Link>
          )}
        </div>
      </div>

      {/* Pro Operator Subscription Status Banner */}
      <div className="p-6 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[var(--foreground-bright)] uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[var(--htb-green)]" />
                <span>Subscription & Pro Access</span>
              </span>
              {subDetails.isSubscribed ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#e8fff0] dark:bg-[#9fef00]/15 text-[#3b6b00] dark:text-[#9fef00] border border-[var(--htb-green)] uppercase">
                  ⚡ ACTIVE PRO OPERATOR
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--surface-elevated)] text-[var(--foreground-muted)] border border-[var(--surface-border)] uppercase">
                  FREE TIER
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--foreground-muted)] font-sans">
              {subDetails.isSubscribed
                ? `Active ${subDetails.plan === "YEARLY" ? "Yearly" : "Monthly"} Pass via ${subDetails.cardBrand || "Mastercard"} (•••• ${subDetails.cardLast4 || "Card"}). You have unrestricted access to all private writeups.`
                : "You currently have a Free account. Upgrade to Pro with Mastercard to unlock all restricted lab walkthroughs and zero-day research."}
            </p>
            {subDetails.isSubscribed && subDetails.expiresAt && (
              <div className="text-[11px] font-mono text-[var(--foreground-muted)] pt-1">
                Expires: <strong className="text-[var(--foreground-bright)]">{subDetails.expiresAt.toLocaleDateString()}</strong> ({subDetails.daysRemaining} days remaining)
              </div>
            )}
          </div>

          <div>
            {subDetails.isSubscribed ? (
              <Link
                href="/writeups"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--htb-green)] text-white dark:text-[#0b121e] text-xs font-mono font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-md"
              >
                <span>Read Private Writeups &rarr;</span>
              </Link>
            ) : (
              <Link
                href="/subscribe"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--htb-green)] to-[#77c400] text-white dark:text-[#0b121e] text-xs font-mono font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-[0_0_15px_rgba(159,239,0,0.3)] whitespace-nowrap"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Unlock Pro with Mastercard ($9/mo)</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Authored Articles */}
        <div className="p-6 rounded-xl border border-[#1f3352] bg-[#111d30]/70 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#1f3352] pb-2">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#9fef00]" /> Articles ({user.articles.length})
            </h2>
            <Link href="/dashboard/articles" className="text-[11px] font-mono text-[#9fef00] hover:underline">
              Manage &rarr;
            </Link>
          </div>
          <div className="space-y-2">
            {user.articles.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono">No articles authored yet.</p>
            ) : (
              user.articles.map((a) => (
                <div key={a.id} className="space-y-1">
                  <Link href={`/articles/${a.slug}`} className="text-xs font-semibold text-slate-200 hover:text-[#9fef00] transition-colors line-clamp-1">
                    {a.title}
                  </Link>
                  <span className="text-[10px] font-mono text-slate-400 block">
                    Status: {a.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Private & Knowledge Notes */}
        <div className="p-6 rounded-xl border border-[#1f3352] bg-[#111d30]/70 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#1f3352] pb-2">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#2de2e6]" /> Knowledge Notes ({user.knowledgeDocs.length})
            </h2>
            <Link href="/knowledge" className="text-[11px] font-mono text-[#9fef00] hover:underline">
              All Notes &rarr;
            </Link>
          </div>
          <div className="space-y-2">
            {user.knowledgeDocs.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono">No notes recorded yet.</p>
            ) : (
              user.knowledgeDocs.map((doc) => (
                <div key={doc.id} className="space-y-1">
                  <Link href={`/knowledge/${doc.slug}`} className="text-xs font-semibold text-slate-200 hover:text-[#9fef00] transition-colors line-clamp-1">
                    {doc.title}
                  </Link>
                  <span className="text-[10px] font-mono text-slate-400 block">
                    {doc.visibility} • {doc.folder}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Authored Write-ups */}
        <div className="p-6 rounded-xl border border-[#1f3352] bg-[#111d30]/70 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#1f3352] pb-2">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Flag className="w-4 h-4 text-[#9fef00]" /> Lab Write-ups ({user.writeups.length})
            </h2>
            <Link href="/writeups" className="text-[11px] font-mono text-[#9fef00] hover:underline">
              Browse &rarr;
            </Link>
          </div>
          <div className="space-y-2">
            {user.writeups.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono">No lab write-ups created yet.</p>
            ) : (
              user.writeups.map((w) => (
                <div key={w.id} className="space-y-1">
                  <Link href={`/writeups/${w.slug}`} className="text-xs font-semibold text-slate-200 hover:text-[#9fef00] transition-colors line-clamp-1">
                    {w.title}
                  </Link>
                  <span className="text-[10px] font-mono text-slate-400 block">
                    {w.platform} • {w.difficulty}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
