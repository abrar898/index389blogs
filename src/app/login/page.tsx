import Link from "next/link";
import { Shield, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Sign In — CyberVault",
  description: "Sign in to access your CyberVault dashboard, private notes, and contributions.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
}) {
  const { error, redirectTo } = await searchParams;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-8 rounded-2xl border border-[#1f3352] bg-[#111d30]/95 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#0b121e] border border-[#1f3352] flex items-center justify-center text-[#9fef00] mx-auto shadow-[0_0_15px_rgba(159,239,0,0.25)]">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold font-mono text-slate-100 tracking-wider">
            OPERATOR AUTHENTICATION
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Access publication console and privileged intelligence.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[#ff3366]/15 border border-[#ff3366]/40 text-[#ff3366] text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#ff3366] flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form action="/api/auth/login" method="POST" className="space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo || "/"} />

          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                name="email"
                required
                defaultValue="admin@cybervault.local"
                placeholder="operator@domain.local"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#0b121e] border border-[#1f3352] text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#9fef00]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-slate-300">Access Key / Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                name="password"
                required
                defaultValue="AdminCyberVault2026!"
                placeholder="••••••••••••••••"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#0b121e] border border-[#1f3352] text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#9fef00]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-[#9fef00] hover:bg-[#b0ff1a] text-[#0b121e] font-bold text-xs font-mono uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(159,239,0,0.3)] flex items-center justify-center gap-2"
          >
            <span>Authenticate Session</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="p-3.5 rounded-lg bg-[#0b121e] border border-[#1f3352] text-[11px] font-mono text-slate-400 space-y-1">
          <p className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">Pre-seeded Test Credentials:</p>
          <p>
            • Admin: <code className="text-[#9fef00]">admin@cybervault.local</code> / <code className="text-slate-300">AdminCyberVault2026!</code>
          </p>
          <p>
            • Author: <code className="text-[#2de2e6]">author@cybervault.local</code> / <code className="text-slate-300">AuthorCyberVault2026!</code>
          </p>
        </div>

        <div className="text-center text-xs font-mono text-slate-400">
          Don't have an operator profile?{" "}
          <Link href="/register" className="text-[#9fef00] hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
