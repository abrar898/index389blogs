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
  Copy,
  Smartphone,
  Wallet,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { SADAPAY_DETAILS } from "@/lib/subscription";

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

  // Mode: "SADAPAY_DIRECT" (Send to SadaPay account) or "MASTERCARD" (Card form)
  const [paymentMode, setPaymentMode] = useState<"SADAPAY_DIRECT" | "MASTERCARD">("SADAPAY_DIRECT");
  const [plan, setPlan] = useState<"MONTHLY" | "YEARLY">("MONTHLY");

  // SadaPay Direct Fields
  const [trxId, setTrxId] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderName, setSenderName] = useState(currentUser?.name || "");

  // Mastercard Fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState(currentUser?.name || "");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvc, setCvc] = useState("");

  // Guest Fields (when not logged in)
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPassword, setGuestPassword] = useState("");

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    transactionId: string;
    amount: number;
    currency: string;
    plan: string;
    expiresAt: string;
    method: string;
  } | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Format Card Number
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

  // Submit SadaPay Direct Transfer
  const handleSadaPaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!trxId.trim() || trxId.trim().length < 4) {
      setErrorMessage("Please enter the Transaction ID / Reference Number from your SadaPay transfer receipt.");
      return;
    }

    if (!senderPhone.trim()) {
      setErrorMessage("Please enter your sender mobile or account number.");
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
        transactionId: trxId.trim(),
        senderPhone: senderPhone.trim(),
        senderName: senderName.trim() || guestName.trim(),
      };

      if (!currentUser) {
        payload.email = guestEmail.trim();
        payload.name = guestName.trim();
        payload.password = guestPassword;
      }

      const res = await fetch("/api/subscription/sadapay-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit SadaPay transfer verification.");
      }

      setSuccessData({
        transactionId: data.transactionId,
        amount: data.amount,
        currency: "PKR",
        plan: data.plan,
        expiresAt: data.expiresAt,
        method: "SadaPay Direct Transfer",
      });

      setTimeout(() => {
        router.push(returnUrl);
        router.refresh();
      }, 3500);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Mastercard
  const handleMastercardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cleanDigits.length !== 16) {
      setErrorMessage("Please enter a valid 16-digit Mastercard number.");
      return;
    }

    if (!cardBrandInfo?.isMastercard) {
      setErrorMessage("Payment is exclusively for Mastercard (e.g. SadaPay or bank debit/credit Mastercard).");
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
        currency: "USD",
        plan: data.plan,
        expiresAt: data.expiresAt,
        method: "Mastercard Online",
      });

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
            Transfer Confirmed!
          </h2>
          <p className="text-sm text-[var(--foreground-muted)] font-sans">
            Your transfer has been verified and your account is upgraded to <strong>PRO OPERATOR</strong>. All private writeups, deep-dive exploits, and full payload repositories are unlocked.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--surface-border)] font-mono text-left text-xs space-y-2">
          <div className="flex justify-between text-[var(--foreground-muted)]">
            <span>Transaction ID:</span>
            <span className="text-[var(--htb-green)] font-semibold">{successData.transactionId}</span>
          </div>
          <div className="flex justify-between text-[var(--foreground-muted)]">
            <span>Payment Method:</span>
            <span className="text-amber-500 font-bold">{successData.method}</span>
          </div>
          <div className="flex justify-between text-[var(--foreground-muted)]">
            <span>Amount:</span>
            <span className="text-[var(--foreground-bright)] font-bold">
              {successData.currency === "PKR" ? `Rs. ${successData.amount.toLocaleString()} PKR` : `$${successData.amount.toFixed(2)} USD`}
            </span>
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
      {/* Left Column: Plan Picker, Payment Mode Switcher & Account Details / Card Visual (5 Cols) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Payment Method Switcher Tabs */}
        <div className="p-1 rounded-xl bg-[var(--surface-elevated)] border border-[var(--surface-border)] grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setPaymentMode("SADAPAY_DIRECT")}
            className={`py-2.5 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
              paymentMode === "SADAPAY_DIRECT"
                ? "bg-[var(--htb-green)] text-white dark:text-[#0b121e] shadow-md"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>SadaPay Transfer</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMode("MASTERCARD")}
            className={`py-2.5 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
              paymentMode === "MASTERCARD"
                ? "bg-[var(--htb-green)] text-white dark:text-[#0b121e] shadow-md"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Mastercard</span>
          </button>
        </div>

        {/* Plan Duration Switcher */}
        <div className="p-1.5 rounded-xl bg-[var(--surface-card)] border border-[var(--surface-border)] flex gap-1">
          <button
            type="button"
            onClick={() => setPlan("MONTHLY")}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-mono font-bold transition-all ${
              plan === "MONTHLY"
                ? "bg-[var(--htb-green)] text-white dark:text-[#0b121e] shadow-sm"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {paymentMode === "SADAPAY_DIRECT" ? "Monthly (Rs. 2,500)" : "Monthly ($9/mo)"}
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
            {paymentMode === "SADAPAY_DIRECT" ? "Yearly (Rs. 24,000)" : "Yearly ($89/yr)"}
            <span className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#ff3366] text-white uppercase shadow-sm">
              Save 20%
            </span>
          </button>
        </div>

        {/* Dynamic Display based on Mode */}
        {paymentMode === "SADAPAY_DIRECT" ? (
          /* Official SadaPay Receiver Info Card */
          <div className="rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-[#0c1825] via-[#102334] to-[#0a1420] p-6 text-white shadow-2xl relative overflow-hidden space-y-5">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#ff7051] flex items-center justify-center font-bold text-white shadow-md">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs font-mono font-bold text-white tracking-wider">
                    SADAPAY VERIFIED RECEIVER
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Direct Deposit Active
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                PAKISTAN
              </span>
            </div>

            {/* Account Title */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                Account Title (Beneficiary Name)
              </span>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                <span className="font-mono text-sm sm:text-base font-bold text-white tracking-wide">
                  {SADAPAY_DETAILS.accountTitle}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                  SadaPay App
                </span>
              </div>
            </div>

            {/* Mobile / Account Number with Copy */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                SadaPay Mobile / Account Number
              </span>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                <span className="font-mono text-base font-extrabold text-emerald-400 tracking-wider">
                  {SADAPAY_DETAILS.accountNumber}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(SADAPAY_DETAILS.accountNumber, "accountNumber")}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-emerald-500 hover:text-black text-xs font-mono font-bold transition-all flex items-center gap-1"
                >
                  {copiedField === "accountNumber" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* IBAN with Copy */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                SadaPay IBAN (For Raast & All Banks)
              </span>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-slate-200 tracking-wider truncate">
                  {SADAPAY_DETAILS.iban}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(SADAPAY_DETAILS.iban, "iban")}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-emerald-500 hover:text-black text-xs font-mono font-bold transition-all flex items-center gap-1 flex-shrink-0"
                >
                  {copiedField === "iban" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-sans text-emerald-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-white">
                <span>Total Due:</span>
                <span className="text-emerald-400 font-mono text-sm">
                  {plan === "YEARLY"
                    ? `Rs. ${SADAPAY_DETAILS.pricesPKR.YEARLY.toLocaleString()} PKR`
                    : `Rs. ${SADAPAY_DETAILS.pricesPKR.MONTHLY.toLocaleString()} PKR`}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Send from any Pakistani bank (SadaPay, NayaPay, Meezan, Easypaisa, JazzCash, etc.) to the details above.
              </p>
            </div>
          </div>
        ) : (
          /* Live Cyber Mastercard Card Visual */
          <div className="relative w-full aspect-[1.586/1] rounded-2xl p-6 sm:p-7 text-white shadow-2xl overflow-hidden border border-white/20 bg-gradient-to-br from-[#141b2d] via-[#1f2d48] to-[#0c101c] select-none">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#9fef00_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-[var(--htb-green)]/20 rounded-full blur-2xl"></div>

            <div className="relative flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-8 rounded-md bg-gradient-to-tr from-amber-300 via-amber-200 to-amber-400 border border-amber-500/50 relative overflow-hidden shadow-sm">
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-amber-600/60"></div>
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-amber-600/60"></div>
                  <div className="absolute inset-2 border border-amber-600/50 rounded-sm"></div>
                </div>
                <span className="text-white/60 font-mono text-sm tracking-widest">&#128246;</span>
              </div>

              <div className="flex items-center">
                <div className="relative flex items-center -space-x-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#eb001b] shadow-md"></div>
                  <div className="w-9 h-9 rounded-full bg-[#f79e1b] opacity-90 shadow-md"></div>
                </div>
              </div>
            </div>

            <div className="relative mt-8 z-10">
              <span className="block text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                Mastercard Card Number
              </span>
              <div className="font-mono text-lg sm:text-xl font-bold tracking-[0.2em] text-white drop-shadow-md">
                {formattedCardNumber || "•••• •••• •••• ••••"}
              </div>
            </div>

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

            <div className="absolute bottom-2 right-4 text-[9px] font-mono text-slate-400 font-bold tracking-widest">
              {cardBrandInfo ? cardBrandInfo.label : "MASTERCARD SECURE"}
            </div>
          </div>
        )}

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

      {/* Right Column: Interactive Form based on selected Mode (7 Cols) */}
      <div className="lg:col-span-7">
        {paymentMode === "SADAPAY_DIRECT" ? (
          /* SadaPay Direct Verification Form */
          <form
            onSubmit={handleSadaPaySubmit}
            className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-6 sm:p-8 shadow-xl space-y-6"
          >
            <div className="border-b border-[var(--surface-border)] pb-4 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-mono text-[var(--foreground-bright)] flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <span>Confirm SadaPay Transfer</span>
                </h3>
                <p className="text-xs text-[var(--foreground-muted)] font-sans">
                  Transfer sent to <strong>03434021355</strong>. Enter your Transaction Reference ID below to unlock immediately.
                </p>
              </div>
              <div className="text-right">
                <span className="block text-xl font-bold font-mono text-[var(--htb-green)]">
                  {plan === "YEARLY"
                    ? `Rs. ${SADAPAY_DETAILS.pricesPKR.YEARLY.toLocaleString()}`
                    : `Rs. ${SADAPAY_DETAILS.pricesPKR.MONTHLY.toLocaleString()}`}
                </span>
                <span className="text-[10px] font-mono text-[var(--foreground-muted)] uppercase">
                  {plan === "YEARLY" ? "PKR / Year" : "PKR / Month"}
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
                  <span>Create Account (New Pro Operator)</span>
                  <Link href="/login" className="text-[var(--htb-green)] hover:underline text-[11px]">
                    Already registered? Sign In &rarr;
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
                        if (!senderName) setSenderName(e.target.value);
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
                      placeholder="Create secure password for Index 389"
                      className="w-full px-3 py-2 rounded-lg bg-[var(--surface-card)] border border-[var(--surface-border)] text-xs font-mono text-[var(--foreground-bright)] focus:outline-none focus:border-[var(--htb-green)]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Transfer Reference Details */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono text-[var(--foreground-bright)] font-semibold">
                    Transaction ID / Reference Number (TRX ID)
                  </label>
                  <span className="text-[10px] font-mono text-emerald-400">From SadaPay / Bank Receipt</span>
                </div>
                <input
                  type="text"
                  required
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  placeholder="e.g. TRX-9823412 or 1234567890"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--surface-border)] text-xs font-mono text-[var(--foreground-bright)] placeholder:text-[var(--foreground-muted)] tracking-wider focus:outline-none focus:border-emerald-400 uppercase"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-[var(--foreground-bright)] font-semibold">
                    Sender Account / Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="0300 ••••••• (Number you sent from)"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--surface-border)] text-xs font-mono text-[var(--foreground-bright)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-[var(--foreground-bright)] font-semibold">
                    Sender Account Title
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Your Name on Sending App"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--surface-border)] text-xs font-mono text-[var(--foreground-bright)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-[var(--htb-green)] to-emerald-600 text-white dark:text-[#0b121e] font-extrabold text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? "Verifying SadaPay Transfer..."
                  : `Verify & Unlock Pro Access (${plan === "YEARLY" ? "Rs. 24,000 PKR" : "Rs. 2,500 PKR"})`}
              </span>
            </button>

            <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] font-mono text-[var(--foreground-muted)] gap-2 border-t border-[var(--surface-border)]">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Instant Auto-Activation</span>
              </span>
              <span>Direct Bank Settlement</span>
              <span>24/7 Verified Access</span>
            </div>
          </form>
        ) : (
          /* Mastercard Online Form */
          <form
            onSubmit={handleMastercardSubmit}
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
                    onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, "").slice(0, 2))}
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
                    onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, "").slice(0, 2))}
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
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
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
        )}
      </div>
    </div>
  );
}
