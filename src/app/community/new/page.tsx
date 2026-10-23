import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { ArrowLeft, MessageSquare, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Start a Discussion — CyberVault Community",
  description: "Share cybersecurity questions, CTF breakthroughs, or defensive insights with the community.",
};

export default async function NewDiscussionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  const { error } = await searchParams;

  if (!user) {
    redirect("/login?error=Please+sign+in+to+participate+in+discussions");
  }

  const categories = [
    { label: "General Discussion", value: "GENERAL" },
    { label: "Vulnerability Research", value: "RESEARCH" },
    { label: "Offensive Methodology & Labs", value: "METHODOLOGY" },
    { label: "Careers, Certifications & Training", value: "CAREER" },
    { label: "Defensive Security & Blue Team", value: "DEFENSIVE" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Link
        href="/community"
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-[#9fef00] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Community
      </Link>

      <div className="space-y-2 border-b border-[#1f3352] pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-[#9fef00]">
          <MessageSquare className="w-4 h-4" />
          <span>OPERATOR KNOWLEDGE EXCHANGE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
          START A COMMUNITY THREAD
        </h1>
        <p className="text-xs text-slate-400 font-sans">
          Posts are peer-reviewed and indexed across the repository. Respect community guidelines and avoid posting active live flags.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/20 text-rose-400 text-xs font-mono flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{decodeURIComponent(error)}</span>
        </div>
      )}

      <form
        action="/api/community/discussions/create"
        method="POST"
        className="p-6 sm:p-8 rounded-2xl border border-[#1f3352] bg-[#111d30]/90 space-y-6 shadow-xl"
      >
        <div>
          <label className="block text-xs font-mono font-bold text-slate-200 mb-2 uppercase">
            Topic Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            required
            minLength={5}
            maxLength={180}
            placeholder="e.g. Kerberoasting against Windows Server 2025: Observed event IDs & mitigations"
            className="w-full px-4 py-2.5 rounded-lg bg-[#0b121e] border border-[#1f3352] text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#9fef00] transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-slate-200 mb-2 uppercase">
            Category <span className="text-rose-500">*</span>
          </label>
          <select
            name="category"
            required
            className="w-full px-4 py-2.5 rounded-lg bg-[#0b121e] border border-[#1f3352] text-xs font-mono text-slate-200 focus:outline-none focus:border-[#9fef00] transition-colors"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono font-bold text-slate-200 mb-2 uppercase">
            Thread Body (Markdown Supported) <span className="text-rose-500">*</span>
          </label>
          <textarea
            name="content"
            required
            rows={8}
            minLength={15}
            placeholder="Describe your research, question, command outputs, or scenario in detail..."
            className="w-full px-4 py-3 rounded-lg bg-[#0b121e] border border-[#1f3352] text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#9fef00] transition-colors"
          ></textarea>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400">
            Posting as: <strong className="text-[#9fef00]">{user.name}</strong> ({user.role})
          </span>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-[#9fef00] hover:bg-[#b4fa1f] text-[#0b121e] font-mono font-bold text-xs uppercase transition-all shadow-[0_0_15px_rgba(159,239,0,0.3)]"
          >
            Publish Thread
          </button>
        </div>
      </form>
    </div>
  );
}
