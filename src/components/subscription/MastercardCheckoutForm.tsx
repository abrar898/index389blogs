"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  CreditCard,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Zap,
  Check,
} from "lucide-react";
import Link from "next/link";

interface MastercardCheckoutFormProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  initialSubscribed?: boolean;
}

export function MastercardCheckoutForm({
  currentUser,
  initialSubscribed = false,
}: MastercardCheckoutFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams?.get("returnUrl") || "/writeups";

  const [plan, setPlan] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState(currentUser?.name || "");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvc, setCvc] = useState("");

  // Guest fields (only when not logged in)
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPassword, setGuestPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    transactionId: string;
    amount: number;
    plan: string;
    expiresAt: string;
  } | null>(null);

  // Clean and format card number
  const cleanDigits = useMemo(() => cardNumber.replace(/\D/g, "").slice(0, 16), [cardNumber]);

  const formattedCardNumber = useMemo(() => {
    return cleanDigits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  }, [cleanDigits]);

  // Card brand detection (Mastercard 51-55 or 2221-2720)
  const cardBrandInfo = useMemo(() => {
    if (cleanDigits.length < 2) return null;
    const p2 = parseInt(cleanDigits.slice(0, 2), 10);
    const p4 = cleanDigits.length >= 4 ? parseInt(cleanDigits.slice(0, 4), 10) : null;

    if (p2 >= 51 && p2 <= 55) {
      return { isMastercard: true, label: "Mastercard" };
    }
    if (p4 !== null && p4 >= 2221 && p4 <= 2720) {
      return { isMastercard: true, label: "Mastercard (SadaPay / Debit)" };
    }
    if (cleanDigits.startsWith("4")) {
      return { isMastercard: false, label: "Visa (Mastercard Only Accepted)" };
    }
    return { isMastercard: false, label: "Other Card (Mastercard Only)" };
  }, [cleanDigits]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    setCardNumber(raw);
  };

  const handleExpiryMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
    setExpiryMonth(raw);
  };

  const handleExpiryYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
    setExpiryYear(raw);
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 3);
    setCvc(raw);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cleanDigits.length !== 16) {
      setErrorMessage("Please enter a valid 16-digit Mastercard number.");
      return;
    }

    if (!cardBrandInfo?.isMastercard) {
      setErrorMessage(
        "Payment is exclusively for Mastercard (e.g. SadaPay, NayaPay, or bank debit/credit Mastercard)."
      );
      return;
    }

    if (!cardholderName.trim()) {
      setErrorMessage("Please enter the name printed on the card.");
      return;
    }

    if (!expiryMonth || !expiryYear) {
      setErrorMessage("Please enter the card expiry date (MM / YY).");
      return;
    }

    if (cvc.length !== 3) {
      setErrorMessage("Please enter the 3-digit CVC code on the back of your card.");
      return;
    }

    if (!currentUser && (!guestEmail || !guestPassword || !guestName)) {
      setErrorMessage("Please fill out your account details to register your Pro subscription.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        plan,
        cardNumber: cleanDigits,
        cardholderName: cardholderName.trim(),
        expiryMonth,
        expiryYear,
        cvc,
      };

      if (!currentUser) {
        payload.email = guestEmail.trim();
        payload.name = guestName.trim();
        payload.password = guestPassword;
      }

      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment failed. Please verify your Mastercard details.");
      }

      setSuccessData({
        transactionId: data.transactionId,
        amount: data.amount,
        plan: data.plan,
        expiresAt: data.expiresAt,
      });

      // After 3 seconds, redirect to the target writeup or returnUrl
      setTimeout(() => {
        router.push(returnUrl);
        router.refresh();
      }, 3500);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (initialSubscribed && !successData) {
    return (
      <div className="max-w-xl mx-auto rounded-2xl border border-[var(--htb-green)]/40 bg-[var(--surface-card)] p-8 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-[var(--htb-green)]/10 border border-[var(--htb-green)] text-[var(--htb-green)] flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(159,239,0,0.3)]">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-mono text-[var(--foreground-bright)]">
            Pro Operator Active
          </h2>
          <p className="text-sm text-[var(--foreground-muted)] font-sans">
            Your account already possesses an active Pro Operator subscription. All private articles, vulnerability research, and write-ups are fully unlocked.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/writeups"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--htb-green)] text-white dark:text-[#0b121e] font-bold text-xs font-mono uppercase tracking-wider shadow-lg hover:brightness-110 transition-all"
          >
            <span>Explore Private Write-ups</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (successData) {
    return (
      <div className="max-w-xl mx-auto rounded-2xl border border-[var(--htb-green)] bg-[var(--surface-card)] p-8 sm:p-10 text-center space-y-6 shadow-[0_0_30px_rgba(159,239,0,0.25)] relative overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 rounded-full bg-[var(--htb-green)]/20 border-2 border-[var(--htb-green)] text-[var(--htb-green)] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(159,239,0,0.4)]">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#e8fff0] dark:bg-[#9fef00]/10 text-[#3b6b00] dark:text-[#9fef00] border border-[var(--htb-green)]/40 uppercase">
            ⚡ Pro Access Granted
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--foreground-bright)]">
            Payment Completed!
          </h2>
          <p className="text-sm text-[var(--foreground-muted)] font-sans">
            Your Mastercard has been successfully charged. All private writeups, deep-dive exploits, and full-resolution payload architectures are now unlocked.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--surface-border)] font-mono text-left text-xs space-y-2">
          <div className="flex justify-between text-[var(--foreground-muted)]">
            <span>Transaction ID:</span>
            <span className="text-[var(--htb-green)] font-semibold">{successData.transactionId}</span>
          </div>
          <div className="flex justify-between text-[var(--foreground-muted)]">
            <span>Charged Amount:</span>
            <span className="text-[var(--foreground-bright)] font-bold">
              ${successData.amount.toFixed(2)} USD
            </span>
          </div>
          <div className="flex justify-between text-[var(--foreground-muted)]">
            <span>Payment Method:</span>
            <span className="text-amber-500 font-bold">Mastercard (Processed)</span>
          </div>
          <div className="flex justify-between text-[var(--foreground-muted)]">
            <span>Tier:</span>
            <span className="text-[var(--foreground-bright)]">
              {successData.plan === "YEARLY" ? "Pro Operator Annual (365 Days)" : "Pro Operator Monthly (30 Days)"}
            </span>
          </div>
        </div>

        <div className="pt-2">
          <Link
            href={returnUrl}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[var(--htb-green)] text-white dark:text-[#0b121e] font-bold text-xs font-mono uppercase tracking-wider shadow-lg hover:brightness-110 transition-all"
          >
            <span>Proceed to Write-up &rarr;</span>
          </Link>
          <p className="text-[11px] font-mono text-[var(--foreground-muted)] mt-2">
            Auto-redirecting in a few moments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Plan selection & Cyber Mastercard preview (Left 5 Cols) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Tier switcher */}
        <div className="p-1.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--surface-border)] flex gap-1">
          <button
            type="button"
            onClick={() => setPlan("MONTHLY")}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-mono font-bold transition-all ${
              plan === "MONTHLY"
                ? "bg-[var(--htb-green)] text-white dark:text-[#0b121e] shadow-sm"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Monthly Pass ($9/mo)
          </button>
          <button
            type="button"
            onClick={() => setPlan("YEARLY")}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-mono font-bold transition-all relative ${
              plan === "YEARLY"
                ? "bg-[var(--htb-green)] text-white dark:text-[#0b121e] shadow-sm"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Yearly Pass ($89/yr)
            <span className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#ff3366] text-white uppercase shadow-sm">
              Save 18%
            </span>
          </button>
        </div>

        {/* Live Cyber Mastercard Card Visual */}
        <div className="relative w-full aspect-[1.586/1] rounded-2xl p-6 sm:p-7 text-white shadow-2xl overflow-hidden border border-white/20 bg-gradient-to-br from-[#141b2d] via-[#1f2d48] to-[#0c101c] select-none">
          {/* Neon cyber grid background texture */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#9fef00_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-[var(--htb-green)]/20 rounded-full blur-2xl"></div>

          {/* Card Top: Chip and Brand */}
          <div className="relative flex items-center justify-between z-10">
            {/* Realistic Chip & Contactless */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-8 rounded-md bg-gradient-to-tr from-amber-300 via-amber-200 to-amber-400 border border-amber-500/50 relative overflow-hidden shadow-sm">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-amber-600/60"></div>
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-amber-600/60"></div>
                <div className="absolute inset-2 border border-amber-600/50 rounded-sm"></div>
              </div>
              {/* Contactless symbol */}
              <span className="text-white/60 font-mono text-sm tracking-widest">&#128246;</span>
            </div>

            {/* Official Mastercard Interlocking Circles Logo */}
            <div className="flex items-center">
              <div className="relative flex items-center -space-x-3.5">
                <div className="w-9 h-9 rounded-full bg-[#eb001b] shadow-md"></div>
                <div className="w-9 h-9 rounded-full bg-[#f79e1b] opacity-90 shadow-md"></div>
              </div>
            </div>
          </div>

          {/* Live Card Number */}
          <div className="relative mt-8 z-10">
            <span className="block text-[10px] font-mono tracking-widest text-slate-400 uppercase">
              Mastercard Card Number
            </span>
            <div className="font-mono text-lg sm:text-xl font-bold tracking-[0.2em] text-white drop-shadow-md">
              {formattedCardNumber || "•••• •••• •••• ••••"}
            </div>
          </div>

          {/* Card Bottom: Holder Name, Expiry & SadaPay badge */}
          <div className="relative mt-6 flex items-end justify-between z-10">
            <div className="space-y-0.5">
              <span className="block text-[9px] font-mono tracking-widest text-slate-400 uppercase">
                Cardholder Name
              </span>
              <span className="block font-mono text-xs sm:text-sm font-semibold tracking-wider text-slate-100 uppercase truncate max-w-[170px]">
                {cardholderName || (currentUser ? currentUser.name : "YOUR NAME")}
              </span>
            </div>

            <div className="flex items-end gap-4">
              <div className="space-y-0.5 text-right">
                <span className="block text-[9px] font-mono tracking-widest text-slate-400 uppercase">
                  Expires
                </span>
                <span className="block font-mono text-xs sm:text-sm font-semibold tracking-wider text-slate-100">
                  {expiryMonth || "MM"} / {expiryYear || "YY"}
                </span>
              </div>
            </div>
          </div>

          {/* Mastercard badge bottom pill */}
          <div className="absolute bottom-2 right-4 text-[9px] font-mono text-slate-400 font-bold tracking-widest">
            {cardBrandInfo ? cardBrandInfo.label : "MASTERCARD SECURE"}
          </div>
        </div>

        {/* Benefits checklist */}
        <div className="p-5 rounded-xl bg-[var(--surface-card)] border border-[var(--surface-border)] space-y-3">
          <div className="text-xs font-mono font-bold text-[var(--foreground-bright)] uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-[var(--htb-green)]" />
            <span>Unlocked Pro Operator Capabilities</span>
          </div>
          <ul className="space-y-2 text-xs font-sans text-[var(--foreground-muted)]">
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[var(--htb-green)] flex-shrink-0" />
              <span>Full unrestricted access to all Private Write-ups & Research</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[var(--htb-green)] flex-shrink-0" />
              <span>Zero passcode gates — instant one-click decryption</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[var(--htb-green)] flex-shrink-0" />
              <span>Full Word (.DOCX) & Printable PDF exploitation exports</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[var(--htb-green)] flex-shrink-0" />
              <span>Glowing Pro Operator badge throughout Index 389</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Mastercard Checkout Form (Right 7 Cols) */}
      <div className="lg:col-span-7">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-6 sm:p-8 shadow-xl space-y-6"
        >
          <div className="border-b border-[var(--surface-border)] pb-4 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-bold font-mono text-[var(--foreground-bright)] flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[var(--htb-green)]" />
                <span>Pay with Mastercard</span>
              </h3>
              <p className="text-xs text-[var(--foreground-muted)] font-sans">
                Supports Pakistani debit Mastercards (SadaPay, NayaPay) and international Mastercards.
              </p>
            </div>
            <div className="text-right">
              <span className="block text-xl font-bold font-mono text-[var(--htb-green)]">
                {plan === "YEARLY" ? "$89.00" : "$9.00"}
              </span>
              <span className="text-[10px] font-mono text-[var(--foreground-muted)] uppercase">
                {plan === "YEARLY" ? "Per Year" : "Per Month"}
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-[#ff3366]/10 border border-[#ff3366]/40 text-[#ff3366] text-xs font-mono flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#ff3366]" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Guest Account Info (If not logged in) */}
          {!currentUser && (
            <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--surface-border)] space-y-3">
              <div className="text-xs font-mono font-bold text-[var(--foreground-bright)] flex items-center justify-between">
                <span>Account Setup (New Operator)</span>
                <Link href="/login" className="text-[var(--htb-green)] hover:underline text-[11px]">
                  Already have an account? Sign In &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[var(--foreground-muted)]">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => {
                      setGuestName(e.target.value);
                      if (!cardholderName) setCardholderName(e.target.value);
                    }}
                    placeholder="e.g. Alex Vance"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-card)] border border-[var(--surface-border)] text-xs font-mono text-[var(--foreground-bright)] focus:outline-none focus:border-[var(--htb-green)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[var(--foreground-muted)]">Email Address</label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-card)] border border-[var(--surface-border)] text-xs font-mono text-[var(--foreground-bright)] focus:outline-none focus:border-[var(--htb-green)]"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-mono text-[var(--foreground-muted)]">Password</label>
                  <input
                    type="password"
                    required
                    value={guestPassword}
                    onChange={(e) => setGuestPassword(e.target.value)}
                    placeholder="Secure password for Index 389"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-card)] border border-[var(--surface-border)] text-xs font-mono text-[var(--foreground-bright)] focus:outline-none focus:border-[var(--htb-green)]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mastercard Payment Inputs */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-[var(--foreground-bright)] font-semibold">
                Cardholder Name
              </label>
              <input
                type="text"
                required
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="Name as printed on Mastercard"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--surface-border)] text-xs font-mono text-[var(--foreground-bright)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--htb-green)]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono text-[var(--foreground-bright)] font-semibold">
                  Mastercard Number (16 Digits)
                </label>
                {cardBrandInfo && (
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      cardBrandInfo.isMastercard ? "text-[var(--htb-green)]" : "text-[#ff3366]"
                    }`}
                  >
                    {cardBrandInfo.label}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formattedCardNumber}
                  onChange={handleCardNumberChange}
                  maxLength={19}
                  placeholder="5100 •••• •••• •••• (e.g. SadaPay Mastercard)"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--surface-border)] text-xs font-mono text-[var(--foreground-bright)] placeholder:text-[var(--foreground-muted)] tracking-wider focus:outline-none focus:border-[var(--htb-green)]"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center -space-x-2 pointer-events-none">
                  <div className="w-5 h-5 rounded-full bg-[#eb001b]"></div>
                  <div className="w-5 h-5 rounded-full bg-[#f79e1b] opacity-90"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-[var(--foreground-bright)] font-semibold">
                  Expiry Month
                </label>
                <input
                  type="text"
                  required
                  value={expiryMonth}
                  onChange={handleExpiryMonthChange}
                  maxLength={2}
                  placeholder="MM (e.g. 08)"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--surface-border)] text-xs font-mono text-[var(--foreground-bright)] placeholder:text-[var(--foreground-muted)] text-center focus:outline-none focus:border-[var(--htb-green)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-[var(--foreground-bright)] font-semibold">
                  Expiry Year
                </label>
                <input
                  type="text"
                  required
                  value={expiryYear}
                  onChange={handleExpiryYearChange}
                  maxLength={2}
                  placeholder="YY (e.g. 28)"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--surface-border)] text-xs font-mono text-[var(--foreground-bright)] placeholder:text-[var(--foreground-muted)] text-center focus:outline-none focus:border-[var(--htb-green)]"
                />
              </div>

              <div className="col-span-2 sm:col-span-1 space-y-1.5">
                <label className="block text-xs font-mono text-[var(--foreground-bright)] font-semibold">
                  CVC / CVV
                </label>
                <input
                  type="password"
                  required
                  value={cvc}
                  onChange={handleCvcChange}
                  maxLength={3}
                  placeholder="3 digits"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--surface-border)] text-xs font-mono text-[var(--foreground-bright)] placeholder:text-[var(--foreground-muted)] text-center tracking-widest focus:outline-none focus:border-[var(--htb-green)]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--htb-green)] to-[#77c400] text-white dark:text-[#0b121e] font-extrabold text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(159,239,0,0.3)] hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isSubmitting
                ? "Processing Mastercard..."
                : `Pay ${plan === "YEARLY" ? "$89.00 USD" : "$9.00 USD"} with Mastercard`}
            </span>
          </button>

          <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] font-mono text-[var(--foreground-muted)] gap-2 border-t border-[var(--surface-border)]">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[var(--htb-green)]" />
              <span>256-Bit TLS Encryption</span>
            </span>
            <span>Mastercard 3D Secure Protected</span>
            <span>Cancel Anytime</span>
          </div>
        </form>
      </div>
    </div>
  );
}
