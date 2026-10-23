import Link from "next/link";
import {
  Shield,
  User,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  GraduationCap,
  PenTool,
} from "lucide-react";

export const metadata = {
  title: "Register Account — CyberVault",
  description:
    "Create a verified CyberVault operator profile to read research, submit write-ups, and participate in technical disclosures.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg p-6 sm:p-8 rounded-2xl border border-[#1f3352] bg-[#111d30]/95 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#0b121e] border border-[#1f3352] flex items-center justify-center text-[#9fef00] mx-auto shadow-[0_0_15px_rgba(159,239,0,0.25)]">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-slate-100 tracking-wider">
            CREATE OPERATOR PROFILE
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Join the community as a Student operator or an Author to publish research and write-ups.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[#ff3366]/15 border border-[#ff3366]/40 text-[#ff3366] text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#ff3366] flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form action="/api/auth/register" method="POST" className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-slate-300">Callsign / Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                name="name"
                required
                placeholder="Agent Zero"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#0b121e] border border-[#1f3352] text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#9fef00]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                name="email"
                required
                placeholder="agent@domain.local"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#0b121e] border border-[#1f3352] text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#9fef00]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-slate-300">
              Password (min 8 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                name="password"
                required
                minLength={8}
                placeholder="••••••••••••••••"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#0b121e] border border-[#1f3352] text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#9fef00]"
              />
            </div>
          </div>

          {/* Role Selection: Student / Reader vs Author / Researcher */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-mono font-bold text-slate-200">
              Select Operator Role <span className="text-[#9fef00]">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Student / Reader */}
              <label className="relative flex flex-col p-3.5 rounded-xl border border-[#1f3352] bg-[#0b121e] hover:border-[#9fef00]/50 cursor-pointer transition-all has-[:checked]:border-[#9fef00] has-[:checked]:bg-[#14233c] has-[:checked]:shadow-[0_0_15px_rgba(159,239,0,0.15)] group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-100 group-has-[:checked]:text-[#9fef00]">
                    <GraduationCap className="w-4 h-4 text-[#9fef00]" />
                    <span>Student / Reader</span>
                  </div>
                  <input
                    type="radio"
                    name="role"
                    value="READER"
                    defaultChecked
                    className="accent-[#9fef00]"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  Read vulnerability research, solve lab machines, join discussions, and save bookmarks.
                </p>
                <span className="mt-2 text-[10px] font-mono text-[#9fef00] uppercase font-bold">
                  Reader Access
                </span>
              </label>

              {/* Option 2: Author / Researcher */}
              <label className="relative flex flex-col p-3.5 rounded-xl border border-[#1f3352] bg-[#0b121e] hover:border-[#2de2e6]/50 cursor-pointer transition-all has-[:checked]:border-[#2de2e6] has-[:checked]:bg-[#14233c] has-[:checked]:shadow-[0_0_15px_rgba(45,226,230,0.15)] group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-100 group-has-[:checked]:text-[#2de2e6]">
                    <PenTool className="w-4 h-4 text-[#2de2e6]" />
                    <span>Author / Researcher</span>
                  </div>
                  <input
                    type="radio"
                    name="role"
                    value="AUTHOR"
                    className="accent-[#2de2e6]"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  Publish offensive articles, write CTF lab walkthroughs, create cheat sheets, and triage CVEs.
                </p>
                <span className="mt-2 text-[10px] font-mono text-[#2de2e6] uppercase font-bold">
                  Publishing & Labs
                </span>
              </label>
            </div>
            <p className="text-[10px] font-mono text-slate-500 pt-0.5">
              * Administrator roles are assigned strictly by platform secops governance.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-[#9fef00] hover:bg-[#b0ff1a] text-[#0b121e] font-bold text-xs font-mono uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(159,239,0,0.3)] flex items-center justify-center gap-2"
          >
            <span>Register Profile</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs font-mono text-slate-400">
          Already registered?{" "}
          <Link href="/login" className="text-[#9fef00] hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
