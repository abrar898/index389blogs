import { Metadata } from "next";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { isUserSubscribed } from "@/lib/subscription";
import { MastercardCheckoutForm } from "@/components/subscription/MastercardCheckoutForm";
import { Shield, Lock, CreditCard, Sparkles, Check, HelpCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pro Operator Pass | Index 389",
  description:
    "Subscribe to Index 389 Pro Operator with Mastercard. Unlock all private vulnerability writeups, zero-day exploit paths, and DOCX/PDF research exports.",
};

export default async function SubscribePage() {
  const currentUser = await getCurrentUser();
  const initialSubscribed = await isUserSubscribed(currentUser?.id);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Top Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--htb-green)]/40 bg-[var(--htb-green)]/10 text-[var(--htb-green)] text-xs font-mono font-bold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PRO OPERATOR MEMBERSHIP</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold font-mono tracking-tight text-[var(--foreground-bright)]">
          Unlock All <span className="text-[var(--htb-green)]">Private Write-ups</span>
        </h1>

        <p className="text-sm sm:text-base text-[var(--foreground-muted)] font-sans leading-relaxed">
          Get unrestricted access to elite cybersecurity intelligence, full-chain exploit writeups, proof-of-concept repositories, and printable technical documentation.
        </p>

        {/* SadaPay / Mastercard notice */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[var(--surface-card)] border border-[var(--surface-border)] text-xs font-mono text-[var(--foreground)] shadow-sm">
          <div className="flex items-center -space-x-1 flex-shrink-0">
            <span className="w-4 h-4 rounded-full bg-[#ff7051] flex items-center justify-center text-[9px] text-white font-bold">S</span>
            <div className="w-4 h-4 rounded-full bg-[#eb001b]"></div>
          </div>
          <span>
            <strong className="text-[var(--htb-green)]">SadaPay Mastercard & Bank Transfer (Rs. 50 PKR Test)</strong> — Instant Mobile In-App Approval
          </span>
        </div>
      </div>

      {/* Main Checkout Experience */}
      <Suspense
        fallback={
          <div className="p-12 text-center font-mono text-xs text-[var(--foreground-muted)]">
            Loading Mastercard checkout...
          </div>
        }
      >
        <MastercardCheckoutForm
          currentUser={
            currentUser
              ? {
                  id: currentUser.id,
                  name: currentUser.name,
                  email: currentUser.email,
                  role: currentUser.role,
                }
              : null
          }
          initialSubscribed={initialSubscribed}
        />
      </Suspense>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto pt-8 border-t border-[var(--surface-border)] space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold font-mono text-[var(--foreground-bright)] flex items-center justify-center gap-2">
            <HelpCircle className="w-5 h-5 text-[var(--htb-green)]" />
            <span>Frequently Asked Questions</span>
          </h2>
          <p className="text-xs text-[var(--foreground-muted)] font-sans">
            Everything you need to know about your Index 389 Pro Operator Pass.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--surface-border)] space-y-1.5">
            <h3 className="text-xs font-mono font-bold text-[var(--foreground-bright)]">
              Do I get instant access to private writeups?
            </h3>
            <p className="text-xs font-sans text-[var(--foreground-muted)] leading-relaxed">
              Yes. The instant your Mastercard transaction completes, your account is immediately flagged as an active Pro Operator. All private articles and writeups will unlock automatically without requiring passcodes.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--surface-border)] space-y-1.5">
            <h3 className="text-xs font-mono font-bold text-[var(--foreground-bright)]">
              Can I pay with my SadaPay or NayaPay card?
            </h3>
            <p className="text-xs font-sans text-[var(--foreground-muted)] leading-relaxed">
              Absolutely! SadaPay and NayaPay cards are official Mastercard debit cards (16 digits with Mastercard BINs). They are 100% accepted on Index 389.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--surface-border)] space-y-1.5">
            <h3 className="text-xs font-mono font-bold text-[var(--foreground-bright)]">
              What perks do Pro Operators receive?
            </h3>
            <p className="text-xs font-sans text-[var(--foreground-muted)] leading-relaxed">
              Pro Operators get full decryption of all restricted research, exploit payloads, full-resolution diagrams, Microsoft Word (.DOCX) report exports, and a VIP badge on the platform.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--surface-border)] space-y-1.5">
            <h3 className="text-xs font-mono font-bold text-[var(--foreground-bright)]">
              What if I need an invoice or receipt?
            </h3>
            <p className="text-xs font-sans text-[var(--foreground-muted)] leading-relaxed">
              Every completed transaction receives a unique transaction reference (e.g. TXN_MC_...) recorded in your profile and audit logs for your records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
