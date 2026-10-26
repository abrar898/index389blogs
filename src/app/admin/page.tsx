import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/rbac";
import {
  Shield,
  Users,
  FileText,
  ShieldAlert,
  Flag,
  BookOpen,
  Activity,
  ArrowRight,
  MessageSquare,
  Lock,
  CreditCard,
  Wallet,
  Smartphone,
} from "lucide-react";
import { AdminTelemetrySection } from "@/components/admin/AdminTelemetrySection";

export const metadata = {
  title: "Admin Console & Platform Intelligence — CyberVault",
};

export default async function AdminDashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || !isAdmin(currentUser)) {
    redirect("/login?redirectTo=/admin");
  }

  // Fetch real statistics from database
  const [
    userCount,
    articleCount,
    cveCount,
    writeupCount,
    kbCount,
    commentCount,
    auditLogs,
    recentUsers,
  ] = await Promise.all([
    db.user.count(),
    db.article.count(),
    db.cVERecord.count(),
    db.writeUp.count(),
    db.knowledgeDocument.count(),
    db.comment.count(),
    db.auditLog.findMany({
      take: 8,
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
    db.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    }),
  ]);

  let recentPayments: any[] = [];
  try {
    recentPayments = await (db as any).subscriptionPayment.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });
  } catch (e) {
    console.warn("Could not query subscription payments:", e);
  }

  const stats = [
    { label: "Total Operators", value: userCount, icon: Users, color: "text-[#9fef00]", href: "/admin/users" },
    { label: "Articles & Papers", value: articleCount, icon: FileText, color: "text-[#2de2e6]", href: "/dashboard/articles" },
    { label: "CVE Advisories", value: cveCount, icon: ShieldAlert, color: "text-[#ff3366]", href: "/vulnerabilities" },
    { label: "Lab Write-ups", value: writeupCount, icon: Flag, color: "text-[#ff8400]", href: "/writeups" },
    { label: "Knowledge Docs", value: kbCount, icon: BookOpen, color: "text-[#9fef00]", href: "/knowledge" },
    { label: "Comments & Reviews", value: commentCount, icon: MessageSquare, color: "text-[#2de2e6]", href: "/admin/comments" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#1f3352] gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#9fef00] mb-1">
            <Shield className="w-4 h-4" />
            <span>PRIMARY MANAGEMENT NODE</span>
          </div>
          <h1 className="text-3xl font-extrabold font-mono text-slate-100 tracking-tight">
            PLATFORM ADMINISTRATION
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time database statistics, access control audits, and publication orchestration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/users"
            className="px-3.5 py-2 rounded-lg bg-[#111d30] border border-[#1f3352] hover:border-[#9fef00] text-xs font-mono text-slate-200 font-semibold transition-colors"
          >
            Manage Roles & Users
          </Link>
          <Link
            href="/dashboard/articles/new"
            className="px-3.5 py-2 rounded-lg bg-[#9fef00] hover:bg-[#b0ff1a] text-[#0b121e] text-xs font-mono font-bold transition-colors shadow-[0_0_15px_rgba(159,239,0,0.3)]"
          >
            New Publication
          </Link>
        </div>
      </div>

      {/* Real Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="p-5 rounded-xl border border-[#1f3352] bg-[#111d30]/90 hover:border-[#9fef00]/60 transition-all space-y-2 block shadow-lg group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                  {s.label}
                </span>
                <Icon className={`w-4 h-4 ${s.color} transition-transform group-hover:scale-110`} />
              </div>
              <p className="text-2xl font-extrabold font-mono text-slate-100">{s.value}</p>
            </Link>
          );
        })}
      </div>

      {/* Recent SadaPay & Pro Operator Payments */}
      <div className="p-6 rounded-2xl border border-[#1f3352] bg-[#111d30]/90 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1f3352] gap-2">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold font-mono text-slate-100 uppercase tracking-wide">
              Incoming SadaPay & Pro Payments
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Beneficiary: <strong className="text-emerald-400">Muhammad Abrar Ahmad (03434021355)</strong></span>
          </div>
        </div>

        {recentPayments.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-[#0b121e]/60 border border-[#1f3352] font-mono text-xs text-slate-500">
            No subscription payments recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#1f3352] text-slate-400">
                  <th className="py-2.5 px-3">Operator</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Transaction ID (TRX)</th>
                  <th className="py-2.5 px-3">Sender Details</th>
                  <th className="py-2.5 px-3">Amount & Plan</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f3352]/50 text-slate-200">
                {recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#14233c]/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-100">{p.user?.name || "Subscriber"}</div>
                      <div className="text-[10px] text-slate-400">{p.user?.email}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      {p.paymentMethod === "SADAPAY_DIRECT" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#ff7051]/20 text-[#ff7051] border border-[#ff7051]/40">
                          <Smartphone className="w-3 h-3" /> SadaPay
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <CreditCard className="w-3 h-3" /> Mastercard
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                      {p.transactionId}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-300">
                      {p.senderPhone ? `${p.senderPhone}${p.senderName ? ` (${p.senderName})` : ""}` : `Card •••• ${p.cardLast4 || "----"}`}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-100">
                        {p.currency === "PKR" ? `Rs. ${p.amount.toLocaleString()} PKR` : `$${p.amount.toFixed(2)} USD`}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase">{p.plan}</div>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Combined Platform Telemetry & Registered Operators */}
      <AdminTelemetrySection
        auditLogs={auditLogs}
        recentUsers={recentUsers}
      />
    </div>
  );
}
