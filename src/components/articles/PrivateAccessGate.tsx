"use client";

import { useState } from "react";
import { Lock, KeyRound, AlertCircle, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface PrivateAccessGateProps {
  articleTitle: string;
  articleSummary?: string;
  slug: string;
  isLoggedIn: boolean;
  userRole?: string;
}

export function PrivateAccessGate({
  articleTitle,
  articleSummary,
  slug,
  isLoggedIn,
  userRole,
}: PrivateAccessGateProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Please enter the access code.");
      return;
    }

    setSubmitting(true);
    // Set cookie for 7 days
    const maxAge = 60 * 60 * 24 * 7;
    document.cookie = `access_code_${slug}=${encodeURIComponent(
      trimmed
    )}; path=/; max-age=${maxAge}; SameSite=Lax`;

    // Refresh page to re-run server component check
    window.location.reload();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="mb-6">
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-[#9fef00] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Articles
        </Link>
      </div>

      <div className="rounded-2xl border border-[#1f3352] bg-[#111d30]/90 backdrop-blur-md p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Ambient glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#9fef00]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400 text-xs font-mono font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>RESTRICTED PUBLICATION / PRIVATE ACCESS</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono tracking-tight leading-tight">
              {articleTitle}
            </h1>
            {articleSummary && (
              <p className="text-sm text-slate-400 font-sans leading-relaxed">
                {articleSummary}
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-[#0b121e] border border-[#1f3352] space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300 font-bold">
              <KeyRound className="w-4 h-4 text-[#9fef00]" />
              <span>Enter Access Code to View Full Writeup</span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              This publication has been marked private by the researcher. If you have been granted an access code or invite passphrase, enter it below to unlock the full walkthrough and exploitation artifacts.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[#ff3366]/15 border border-[#ff3366]/40 text-[#ff3366] text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#ff3366] flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="access-code-input"
                className="block text-xs font-mono text-slate-300 font-semibold"
              >
                Access Code / Passphrase
              </label>
              <div className="relative">
                <input
                  id="access-code-input"
                  type="password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter code (e.g. HTB, cybervault, or custom code)..."
                  className="w-full px-4 py-3 rounded-lg bg-[#0b121e] border border-[#1f3352] text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#9fef00] transition-colors"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#9fef00] hover:bg-[#b0ff1a] text-[#0b121e] font-bold text-xs font-mono uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(159,239,0,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submitting ? "Unlocking..." : "Unlock Writeup"}</span>
            </button>
          </form>

          {/* Pro Operator VIP Mastercard Subscription Option */}
          <div className="relative overflow-hidden rounded-xl border border-[#9fef00]/30 bg-gradient-to-r from-[#0d1c2b] via-[#0f2538] to-[#0d1c2b] p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#9fef00] text-[#0b121e] uppercase">
                    Pro Operator
                  </span>
                  <span className="text-xs font-mono font-semibold text-slate-200">
                    Instant Access to All Private Writeups
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-sans">
                  No passcode needed. Subscribe with your <strong className="text-white">Mastercard</strong> (SadaPay, NayaPay, or bank debit) to unlock all restricted research, exploits & DOCX/PDF downloads immediately.
                </p>
                <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-slate-400">
                  <span className="text-[#9fef00] font-bold">$9/mo</span>
                  <span>or</span>
                  <span className="text-[#9fef00] font-bold">$89/yr (Save 18%)</span>
                  <span>•</span>
                  <span className="text-slate-300">Mastercard Only</span>
                </div>
              </div>

              <Link
                href={`/subscribe?returnUrl=/articles/${slug}`}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#9fef00] to-[#77c400] hover:brightness-110 text-[#0b121e] font-bold text-xs font-mono uppercase tracking-wider text-center transition-all shadow-[0_0_20px_rgba(159,239,0,0.4)] whitespace-nowrap flex items-center justify-center gap-2"
              >
                <span>Unlock with Mastercard &rarr;</span>
              </Link>
            </div>
          </div>

          {/* Admin / login helper note */}
          <div className="pt-4 border-t border-[#1f3352] flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
            <span>
              Are you an Admin or Author?
            </span>
            {isLoggedIn ? (
              <span className="text-slate-300">
                Logged in as <span className="text-[#9fef00] font-bold">{userRole}</span>
              </span>
            ) : (
              <Link
                href={`/login?redirectTo=/articles/${slug}`}
                className="text-[#9fef00] hover:underline font-bold"
              >
                Sign in to Admin Console &rarr;
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
