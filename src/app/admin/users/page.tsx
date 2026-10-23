import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/rbac";
import { Users, ArrowLeft, Shield, Check, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Operator Role Management — CyberVault",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;
  const currentUser = await getCurrentUser();

  if (!currentUser || !isAdmin(currentUser)) {
    redirect("/login?redirectTo=/admin/users");
  }

  const users = await db.user.findMany({
    include: {
      _count: { select: { articles: true, writeups: true, knowledgeDocs: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-[#9fef00] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Overview
      </Link>

      {/* Header */}
      <div className="pb-4 border-b border-[#1f3352]">
        <h1 className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
          <Users className="w-6 h-6 text-[#9fef00]" />
          OPERATOR ROLES & ACCESS CONTROL
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Promote or restrict operators between ADMIN, EDITOR, AUTHOR, READER, and MODERATOR tiers.
        </p>
      </div>

      {success && (
        <div className="p-3 rounded-lg bg-[#9fef00]/15 border border-[#9fef00]/40 text-[#9fef00] text-xs font-mono flex items-center gap-2">
          <Check className="w-4 h-4 text-[#9fef00]" />
          <span>Operator permissions updated successfully and logged in security audit trail.</span>
        </div>
      )}

      {/* Users table */}
      <div className="rounded-xl border border-[#1f3352] bg-[#111d30]/90 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0b121e] border-b border-[#1f3352] text-slate-400 uppercase">
              <tr>
                <th className="p-4">Operator</th>
                <th className="p-4">Current Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Authored Content</th>
                <th className="p-4">Change Role & Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f3352]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#14233c] transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-slate-100">{u.name}</p>
                    <span className="text-[11px] text-slate-400">{u.email}</span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === "ADMIN"
                          ? "bg-[#ff3366]/15 border border-[#ff3366]/40 text-[#ff3366]"
                          : u.role === "EDITOR"
                          ? "bg-purple-950/60 border border-purple-700/60 text-purple-300"
                          : u.role === "AUTHOR"
                          ? "bg-[#2de2e6]/15 border border-[#2de2e6]/40 text-[#2de2e6]"
                          : "bg-[#0b121e] border border-[#1f3352] text-slate-300"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === "ACTIVE"
                          ? "bg-[#9fef00]/15 text-[#9fef00] border border-[#9fef00]/40"
                          : "bg-[#ff3366]/15 text-[#ff3366] border border-[#ff3366]/40"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>

                  <td className="p-4 text-slate-400">
                    {u._count.articles} articles • {u._count.writeups} labs • {u._count.knowledgeDocs} notes
                  </td>

                  <td className="p-4">
                    <form
                      action={`/api/admin/users/${u.id}/role`}
                      method="POST"
                      className="flex items-center gap-2"
                    >
                      <select
                        name="role"
                        defaultValue={u.role}
                        className="px-2 py-1 rounded bg-[#0b121e] border border-[#1f3352] text-slate-200 text-xs focus:outline-none focus:border-[#9fef00]"
                      >
                        <option value="READER">READER</option>
                        <option value="AUTHOR">AUTHOR</option>
                        <option value="EDITOR">EDITOR</option>
                        <option value="MODERATOR">MODERATOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>

                      <select
                        name="status"
                        defaultValue={u.status}
                        className="px-2 py-1 rounded bg-[#0b121e] border border-[#1f3352] text-slate-200 text-xs focus:outline-none focus:border-[#9fef00]"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                      </select>

                      <button
                        type="submit"
                        className="px-2.5 py-1 rounded bg-[#1f3352] hover:bg-[#9fef00] hover:text-[#0b121e] text-slate-200 text-xs font-semibold transition-colors"
                      >
                        Apply
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
