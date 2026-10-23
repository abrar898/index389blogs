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

      {/* Combined Platform Telemetry & Registered Operators */}
      <AdminTelemetrySection
        auditLogs={auditLogs}
        recentUsers={recentUsers}
      />
    </div>
  );
}
