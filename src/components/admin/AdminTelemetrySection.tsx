"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Users,
  Shield,
  Layers,
  ArrowRight,
  Clock,
  Terminal,
  UserCheck,
} from "lucide-react";

export interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: Date | string;
  user: { name: string } | null;
}

export interface RecentUserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date | string;
}

interface AdminTelemetrySectionProps {
  auditLogs: AuditLogItem[];
  recentUsers: RecentUserItem[];
}

type TabType = "ALL" | "AUDIT" | "USERS";

export function AdminTelemetrySection({
  auditLogs,
  recentUsers,
}: AdminTelemetrySectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>("ALL");

  const totalCount = auditLogs.length + recentUsers.length;

  const getActionColor = (action: string) => {
    if (action.includes("DELETE") || action.includes("SUSPEND")) {
      return "text-[#ff3366] bg-red-950/70 border-[#ff3366]/40";
    }
    if (action.includes("LOGIN") || action.includes("SUCCESS")) {
      return "text-[#9fef00] bg-emerald-950/70 border-[#9fef00]/40";
    }
    if (action.includes("REGISTER") || action.includes("CREATE")) {
      return "text-[#2de2e6] bg-cyan-950/70 border-[#2de2e6]/40";
    }
    return "text-[#ff8400] bg-amber-950/70 border-[#ff8400]/40";
  };

  const getRoleBadge = (role: string) => {
    switch (role.toUpperCase()) {
      case "ADMIN":
        return "bg-[#ff3366]/15 border border-[#ff3366]/50 text-[#ff3366] shadow-[0_0_8px_rgba(255,51,102,0.2)]";
      case "AUTHOR":
        return "bg-[#2de2e6]/15 border border-[#2de2e6]/50 text-[#2de2e6] shadow-[0_0_8px_rgba(45,226,230,0.2)]";
      case "EDITOR":
        return "bg-[#ff8400]/15 border border-[#ff8400]/50 text-[#ff8400]";
      case "READER":
      default:
        return "bg-[#111d30] border border-[#1f3352] text-slate-300";
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-[#1f3352] bg-[#111d30]/90 shadow-xl space-y-5">
      {/* Unified Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1f3352] pb-4 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xs sm:text-sm font-mono font-bold tracking-wider text-slate-100 flex items-center gap-2 uppercase">
            <Activity className="w-4 h-4 text-[#9fef00] animate-pulse" />
            <span>PLATFORM TELEMETRY & OPERATOR REGISTRY</span>
          </h2>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#0b121e] p-1 rounded-lg border border-[#1f3352]">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "ALL"
                  ? "bg-[#14233c] text-[#9fef00] border border-[#9fef00]/40 shadow-[0_0_12px_rgba(159,239,0,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#14233c]/60"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>All Activity</span>
              <span className="text-[10px] opacity-70">({totalCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("AUDIT")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "AUDIT"
                  ? "bg-[#14233c] text-[#9fef00] border border-[#9fef00]/40 shadow-[0_0_12px_rgba(159,239,0,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#14233c]/60"
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>Audit Logs</span>
              <span className="text-[10px] opacity-70">({auditLogs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("USERS")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "USERS"
                  ? "bg-[#14233c] text-[#2de2e6] border border-[#2de2e6]/40 shadow-[0_0_12px_rgba(45,226,230,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#14233c]/60"
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Registered Operators</span>
              <span className="text-[10px] opacity-70">({recentUsers.length})</span>
            </button>
          </div>
        </div>

        {/* Dynamic Link */}
        <Link
          href="/admin/users"
          className="text-xs font-mono text-[#9fef00] hover:underline flex items-center gap-1 font-semibold self-start sm:self-auto"
        >
          Manage All Users ({recentUsers.length}) <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Unified Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
        {/* Render Audit Logs if ALL or AUDIT */}
        {(activeTab === "ALL" || activeTab === "AUDIT") &&
          auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 sm:p-3.5 rounded-xl bg-[#0b121e]/90 border border-[#1f3352] hover:border-[#9fef00]/40 hover:bg-[#14233c]/60 transition-all text-xs font-mono flex items-center justify-between gap-3 group"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getActionColor(
                      log.action
                    )}`}
                  >
                    {log.action}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  Target: <span className="text-slate-300 font-bold">{log.entityType}</span>{" "}
                  {log.entityId ? <span className="text-slate-500">[{log.entityId}]</span> : ""}
                </p>
              </div>

              <div className="text-right flex-shrink-0 space-y-0.5">
                <span className="block text-slate-200 font-bold group-hover:text-[#9fef00] transition-colors">
                  {log.user?.name || "System"}
                </span>
                <span className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}

        {/* Render Users if ALL or USERS */}
        {(activeTab === "ALL" || activeTab === "USERS") &&
          recentUsers.map((u) => (
            <div
              key={u.id}
              className="p-3 sm:p-3.5 rounded-xl bg-[#0b121e]/90 border border-[#1f3352] hover:border-[#2de2e6]/40 hover:bg-[#14233c]/60 transition-all text-xs font-mono flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#111d30] border border-[#1f3352] flex items-center justify-center font-bold text-[#2de2e6] text-xs flex-shrink-0">
                  {u.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-200 group-hover:text-[#2de2e6] transition-colors truncate">
                    {u.name}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                </div>
              </div>

              <div className="text-right flex-shrink-0 space-y-1">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${getRoleBadge(
                    u.role
                  )}`}
                >
                  {u.role}
                </span>
                <span className="block text-[10px] text-slate-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
