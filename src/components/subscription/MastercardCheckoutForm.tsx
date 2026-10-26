"use client";

import { useState, useMemo, useEffect } from "react";
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
  BellRing,
  RefreshCw,
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

  // Mode: "MASTERCARD_3DS" (Card + Phone Notification) or "SADAPAY_IBAN" (Direct Bank Transfer)
  const [paymentMode, setPaymentMode] = useState<"MASTERCARD_3DS" | "SADAPAY_IBAN">("MASTERCARD_3DS");
  const [plan, setPlan] = useState<"MONTHLY" | "YEARLY">("MONTHLY");

  // Price (Current Test Mode: 50 PKR)
  const currentPricePKR = plan === "YEARLY" ? SADAPAY_DETAILS.pricesPKR.YEARLY : SADAPAY_DETAILS.pricesPKR.MONTHLY;

  // Mastercard Details
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState(currentUser?.name || "Muhammad Abrar Ahmad");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvc, setCvc] = useState("");

  // SadaPay IBAN Manual Transfer Field
  const [trxId, setTrxId] = useState("");
  const [senderAccountTitle, setSenderAccountTitle] = useState(currentUser?.name || "");

  // Guest fields
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPassword, setGuestPassword] = useState("");

  // 3DS Phone Approval State (Like Claude/Netflix Mastercard Verification)
  const [showPhoneApprovalModal, setShowPhoneApprovalModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [approvalTimer, setApprovalTimer] = useState(120);
  const [phoneNotificationState, setPhoneNotificationState] = useState<"WAITING" | "CONFIRMING" | "APPROVED">("WAITING");

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

  // 120s Countdown timer for phone notification
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showPhoneApprovalModal && approvalTimer > 0 && phoneNotificationState === "WAITING") {
      interval = setInterval(() => {
        setApprovalTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showPhoneApprovalModal, approvalTimer, phoneNotificationState]);

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
      return { isMastercard: true, label: "Mastercard (SadaPay Physical/Virtual)" };
    }
    if (p4 !== null && p4 >= 2221 && p4 <= 2720) {
      return { isMastercard: true, label: "Mastercard (SadaPay Debit)" };
    }
    if (cleanDigits.startsWith("4")) {
      return { isMastercard: false, label: "Visa (Mastercard Only Accepted)" };
    }
    return { isMastercard: true, label: "Mastercard" };
  }, [cleanDigits]);

  // Trigger Phone 3DS Approval Modal
  const handleInitiateCardPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cleanDigits.length !== 16) {
      setErrorMessage("Please enter your 16-digit SadaPay Mastercard number.");
      return;
    }

    if (!cardholderName.trim()) {
      setErrorMessage("Please enter your cardholder name.");
      return;
    }

    if (!expiryMonth || !expiryYear) {
      setErrorMessage("Please enter expiry MM/YY.");
      return;
    }

    if (cvc.length !== 3) {
      setErrorMessage("Please enter 3-digit CVC code.");
      return;
    }

    if (!currentUser && (!guestEmail || !guestPassword || !guestName)) {
      setErrorMessage("Please provide your name, email, and password to create your account.");
      return;
    }

    // Launch the 3DS In-App Mobile Approval prompt
    setApprovalTimer(120);
    setPhoneNotificationState("WAITING");
    setShowPhoneApprovalModal(true);
  };

  // Complete Payment upon Phone Approval or OTP
  const handleConfirmPhoneApproval = async () => {
    setPhoneNotificationState("CONFIRMING");
    setIsSubmitting(true);

    try {
      const payload: any = {
        plan,
        cardNumber: cleanDigits,
        cardholderName: cardholderName.trim(),
        expiryMonth,
        expiryYear,
        cvc,
        amount: currentPricePKR,
        currency: "PKR",
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
        throw new Error(data.error || "Payment verification failed.");
      }

      setPhoneNotificationState("APPROVED");

      setTimeout(() => {
        setShowPhoneApprovalModal(false);
        setSuccessData({
          transactionId: data.transactionId,
          amount: currentPricePKR,
          currency: "PKR",
          plan: data.plan,
          expiresAt: data.expiresAt,
          method: "SadaPay Mastercard (3DS Approved)",
        });

        setTimeout(() => {
          router.push(returnUrl);
          router.refresh();
        }, 3000);
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to confirm payment.");
      setPhoneNotificationState("WAITING");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual SadaPay IBAN Transfer Submit
  const handleIbanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!trxId.trim() || trxId.trim().length < 4) {
      setErrorMessage("Please enter the Transaction ID from your SadaPay transfer receipt.");
      return;
    }

    if (!currentUser && (!guestEmail || !guestPassword || !guestName)) {
      setErrorMessage("Please provide your name, email, and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        plan,
        transactionId: trxId.trim(),
        senderPhone: "IBAN-TRANSFER",
        senderName: senderAccountTitle.trim() || guestName.trim(),
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
        throw new Error(data.error || "Failed to process transfer.");
      }

      setSuccessData({
        transactionId: data.transactionId,
        amount: currentPricePKR,
        currency: "PKR",
        plan: data.plan,
        expiresAt: data.expiresAt,
        method: "SadaPay Bank IBAN Transfer",
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

  if (successData) {
    return (
      <div className="max-w-xl mx-auto rounded-2xl border border-[var(--htb-green)] bg-[var(--surface-card)] p-8 sm:p-10 text-center space-y-6 shadow-[0_0_30px_rgba(159,239,0,0.25)] relative overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 rounded-full bg-[var(--htb-green)]/20 border-2 border-[var(--htb-green)] text-[var(--htb-green)] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(159,239,0,0.4)]">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#e8fff0] dark:bg-[#9fef00]/10 text-[#3b6b00] dark:text-[#9fef00] border border-[var(--htb-green)]/40 uppercase">
            ⚡ Payment Confirmed & Deducted
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--foreground-bright)]">
            Rs. {successData.amount} PKR Deducted!
          </h2>
          <p className="text-sm text-[var(--foreground-muted)] font-sans">
            Your SadaPay payment has been successfully authorized and confirmed. All private writeups, exploit chains, and research papers are now <strong>100% UNLOCKED</strong>.
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
            <span>Amount Deducted:</span>
            <span className="text-[var(--foreground-bright)] font-bold">
              Rs. {successData.amount} PKR
            </span>
          </div>
          <div className="flex justify-between text-[var(--foreground-muted)]">
            <span>Access Status:</span>
            <span className="text-[var(--htb-green)] font-bold uppercase">Pro Operator Unlocked</span>
          </div>
        </div>

        <div className="pt-2">
          <Link
            href={returnUrl}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[var(--htb-green)] text-white dark:text-[#0b121e] font-bold text-xs font-mono uppercase tracking-wider shadow-lg hover:brightness-110 transition-all"
          >
            <span>Proceed to Private Write-ups &rarr;</span>
          </Link>
          <p className="text-[11px] font-mono text-[var(--foreground-muted)] mt-2">
            Auto-redirecting in a few moments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active User Alert (Informs user their status, while still allowing 50 PKR tests) */}
      {initialSubscribed && (
        <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--htb-green)]/40 flex items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--htb-green)] animate-pulse"></span>
            <span className="text-[var(--foreground-bright)]">
              Your account currently has active access. You can test the <strong>Rs. 50 PKR</strong> SadaPay payment flow below.
            </span>
          </div>
          <Link href="/writeups" className="text-[var(--htb-green)] hover:underline whitespace-nowrap">
            View Private Writeups &rarr;
          </Link>
        </div>
      )}

      {/* Main Grid: Left Column Details & Visual (5 Cols), Right Column Form (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Method Switcher Tabs */}
          <div className="p-1 rounded-xl bg-[var(--surface-elevated)] border border-[var(--surface-border)] grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setPaymentMode("MASTERCARD_3DS")}
              className={`py-2.5 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                paymentMode === "MASTERCARD_3DS"
                  ? "bg-[var(--htb-green)] text-white dark:text-[#0b121e] shadow-md"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>SadaPay Card (3DS)</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode("SADAPAY_IBAN")}
              className={`py-2.5 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                paymentMode === "SADAPAY_IBAN"
                  ? "bg-[var(--htb-green)] text-white dark:text-[#0b121e] shadow-md"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>SadaPay Bank IBAN</span>
            </button>
          </div>

          {/* Test Pricing Toggle */}
          <div className="p-1.5 rounded-xl bg-[var(--surface-card)] border border-[var(--surface-border)] flex gap-1">
            <button
              type="button"
              onClick={() => setPlan("MONTHLY")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all ${
                plan === "MONTHLY"
                  ? "bg-[var(--htb-green)] text-white dark:text-[#0b121e] shadow-sm"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Test Pass (Rs. 50 PKR)
            </button>
            <button
              type="button"
              onClick={() => setPlan("YEARLY")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all ${
                plan === "YEARLY"
                  ? "bg-[var(--htb-green)] text-white dark:text-[#0b121e] shadow-sm"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Annual Pass (Rs. 500 PKR)
            </button>
          </div>

          {/* Display Mode A: Live SadaPay Mastercard Visual */}
          {paymentMode === "MASTERCARD_3DS" ? (
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
                  SadaPay Mastercard Number
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
                    {cardholderName || "MUHAMMAD ABRAR AHMAD"}
                  </span>
                </div>

                <div className="space-y-0.5 text-right">
                  <span className="block text-[9px] font-mono tracking-widest text-slate-400 uppercase">
                    Expires
                  </span>
                  <span className="block font-mono text-xs sm:text-sm font-semibold tracking-wider text-slate-100">
                    {expiryMonth || "MM"} / {expiryYear || "YY"}
                  </span>
                </div>
              </div>

              <div className="absolute bottom-2 right-4 text-[9px] font-mono text-emerald-400 font-bold tracking-widest flex items-center gap-1">
                <span>📲 3DS PHONE NOTIFICATION PROTECTED</span>
              </div>
            </div>
          ) : (
            /* Display Mode B: Verified SadaPay Bank Details (Only Bank Account IBAN, No Phone Number) */
            <div className="rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-[#0c1825] via-[#102334] to-[#0a1420] p-6 text-white shadow-2xl relative overflow-hidden space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#ff7051] flex items-center justify-center font-bold text-white shadow-md">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-mono font-bold text-white tracking-wider">
                      SADAPAY BANK DEPOSIT
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Bank Account Details
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  SADAPAY
                </span>
              </div>

              {/* Bank Name */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                  Bank Name
                </span>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-white tracking-wide">
                    {SADAPAY_DETAILS.bankName}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                    State Bank Registered
                  </span>
                </div>
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
                  <button
                    type="button"
                    onClick={() => copyToClipboard(SADAPAY_DETAILS.accountTitle, "title")}
                    className="px-2 py-1 rounded bg-white/10 hover:bg-emerald-500 hover:text-black text-[10px] font-mono transition-all"
                  >
                    {copiedField === "title" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* SadaPay Bank Number (IBAN) */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                  SadaPay Bank Account Number / IBAN
                </span>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs sm:text-sm font-extrabold text-emerald-400 tracking-wider truncate">
                    {SADAPAY_DETAILS.iban}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(SADAPAY_DETAILS.iban, "iban")}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-mono font-bold hover:brightness-110 transition-all flex items-center gap-1 flex-shrink-0"
                  >
                    {copiedField === "iban" ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy IBAN</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-sans text-emerald-200">
                <strong>Amount to Send:</strong> <span className="font-mono font-bold text-white">Rs. {currentPricePKR} PKR</span>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="p-4 rounded-xl bg-[var(--surface-card)] border border-[var(--surface-border)] space-y-2 text-xs font-sans text-[var(--foreground-muted)]">
            <div className="font-mono font-bold text-[var(--foreground-bright)] uppercase text-[11px] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[var(--htb-green)]" />
              <span>What Unlocks for Rs. {currentPricePKR} PKR:</span>
            </div>
            <p>• Immediate unrestricted decryption of all Private Writeups</p>
            <p>• Zero passcode gates throughout Index 389</p>
            <p>• Word (.DOCX) and Printable PDF export capabilities</p>
          </div>
        </div>

        {/* Right Column (7 Cols) */}
        <div className="lg:col-span-7">
          {paymentMode === "MASTERCARD_3DS" ? (
            /* Mastercard Checkout with 3D-Secure Phone Approval */
            <form
              onSubmit={handleInitiateCardPayment}
              className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-6 sm:p-8 shadow-xl space-y-6"
            >
              <div className="border-b border-[var(--surface-border)] pb-4 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold font-mono text-[var(--foreground-bright)] flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    <span>Pay with SadaPay Mastercard</span>
                  </h3>
                  <p className="text-xs text-[var(--foreground-muted)] font-sans">
                    Enter your card details. An in-app approval notification will be sent to your SadaPay mobile app.
                  </p>
                </div>
                <div className="text-right">
                  <span className="block text-xl font-bold font-mono text-[var(--htb-green)]">
                    Rs. {currentPricePKR} PKR
                  </span>
                  <span className="text-[10px] font-mono text-[var(--foreground-muted)] uppercase">
                    Test Mode
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-lg bg-[#ff3366]/10 border border-[#ff3366]/40 text-[#ff3366] text-xs font-mono flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#ff3366]" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Guest Account Info */}
              {!currentUser && (
                <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--surface-border)] space-y-3">
                  <div className="text-xs font-mono font-bold text-[var(--foreground-bright)] flex items-center justify-between">
                    <span>Create Account (New Operator)</span>
                    <Link href="/login" className="text-[var(--htb-green)] hover:underline text-[11px]">
                      Sign In &rarr;
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
                        placeholder="Muhammad Abrar"
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
                        placeholder="abrar@example.com"
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
                        placeholder="Secure password"
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-card)] border border-[var(--surface-border)] text-xs font-mono text-[var(--foreground-bright)] focus:outline-none focus:border-[var(--htb-green)]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Card Inputs */}
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
                    placeholder="Muhammad Abrar Ahmad"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--surface-border)] text-xs font-mono text-[var(--foreground-bright)] focus:outline-none focus:border-emerald-400 uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono text-[var(--foreground-bright)] font-semibold">
                      SadaPay Mastercard Number (16 Digits)
                    </label>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {cardBrandInfo ? cardBrandInfo.label : "Mastercard"}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formattedCardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                      maxLength={19}
                      placeholder="5100 •••• •••• ••••"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--surface-border)] text-xs font-mono text-[var(--foreground-bright)] placeholder:text-[var(--foreground-muted)] tracking-wider focus:outline-none focus:border-emerald-400"
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
                      placeholder="MM"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--surface-border)] text-xs font-mono text-[var(--foreground-bright)] text-center focus:outline-none focus:border-emerald-400"
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
                      placeholder="YY"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--surface-border)] text-xs font-mono text-[var(--foreground-bright)] text-center focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1 space-y-1.5">
                    <label className="block text-xs font-mono text-[var(--foreground-bright)] font-semibold">
                      CVC (3 Digits)
                    </label>
                    <input
                      type="password"
                      required
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      maxLength={3}
                      placeholder="•••"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--surface-border)] text-xs font-mono text-[var(--foreground-bright)] text-center tracking-widest focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-[var(--htb-green)] to-emerald-600 text-white dark:text-[#0b121e] font-extrabold text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Pay Rs. {currentPricePKR} PKR (Trigger Phone Notification)</span>
              </button>

              <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] font-mono text-[var(--foreground-muted)] gap-2 border-t border-[var(--surface-border)]">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SadaPay 3D-Secure Authentication</span>
                </span>
                <span>In-App Mobile Confirmation</span>
              </div>
            </form>
          ) : (
            /* Manual SadaPay Bank IBAN Verification Form */
            <form
              onSubmit={handleIbanSubmit}
              className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-6 sm:p-8 shadow-xl space-y-6"
            >
              <div className="border-b border-[var(--surface-border)] pb-4 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold font-mono text-[var(--foreground-bright)] flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                    <span>SadaPay IBAN Transfer Confirmation</span>
                  </h3>
                  <p className="text-xs text-[var(--foreground-muted)] font-sans">
                    Transfer Rs. {currentPricePKR} PKR to IBAN: <strong>{SADAPAY_DETAILS.iban}</strong>, then enter the Transaction ID below.
                  </p>
                </div>
                <div className="text-right">
                  <span className="block text-xl font-bold font-mono text-[var(--htb-green)]">
                    Rs. {currentPricePKR} PKR
                  </span>
                  <span className="text-[10px] font-mono text-[var(--foreground-muted)] uppercase">
                    Test Mode
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-lg bg-[#ff3366]/10 border border-[#ff3366]/40 text-[#ff3366] text-xs font-mono flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#ff3366]" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-[var(--foreground-bright)] font-semibold">
                    Transaction ID (From SadaPay Transfer Receipt)
                  </label>
                  <input
                    type="text"
                    required
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="e.g. TRX-9823412 or 1234567890"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--surface-border)] text-xs font-mono text-[var(--foreground-bright)] tracking-wider focus:outline-none focus:border-emerald-400 uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-[var(--foreground-bright)] font-semibold">
                    Your Sending Bank Account Name
                  </label>
                  <input
                    type="text"
                    value={senderAccountTitle}
                    onChange={(e) => setSenderAccountTitle(e.target.value)}
                    placeholder="Your Name as on Sending App"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-elevated)] border border-[var(--surface-border)] text-xs font-mono text-[var(--foreground-bright)] focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-[var(--htb-green)] to-emerald-600 text-white dark:text-[#0b121e] font-extrabold text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isSubmitting ? "Verifying..." : `Verify IBAN Transfer (Rs. ${currentPricePKR} PKR)`}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 3D-Secure / SadaPay Mobile App Phone Notification Modal */}
      {showPhoneApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border-2 border-emerald-500/60 bg-[#0d1624] p-6 sm:p-7 text-white shadow-[0_0_50px_rgba(16,185,129,0.4)] space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#ff7051] flex items-center justify-center font-bold text-white shadow-md">
                  <Smartphone className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-mono font-bold text-white">
                    SADAPAY 3D-SECURE
                  </h4>
                  <p className="text-[10px] font-mono text-emerald-400">
                    Phone Notification Sent
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {Math.floor(approvalTimer / 60)}:{(approvalTimer % 60).toString().padStart(2, "0")}
                </span>
                <span className="block text-[9px] font-mono text-slate-400">Expires</span>
              </div>
            </div>

            {/* Notification Simulation Card */}
            <div className="p-4 rounded-xl bg-[#132238] border border-emerald-500/40 space-y-3 relative overflow-hidden">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <BellRing className="w-5 h-5 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-mono font-bold text-white block">
                    Authorization Request: Rs. {currentPricePKR} PKR
                  </span>
                  <p className="text-xs font-sans text-slate-300">
                    Open your <strong>SadaPay app</strong> on your phone. Tap <strong>'Approve'</strong> to authorize the deduction of <strong>Rs. {currentPricePKR} PKR</strong>.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span>Merchant: Index 389 Research</span>
                <span className="text-emerald-400 font-bold">Card: •••• {cleanDigits.slice(-4) || "CARD"}</span>
              </div>
            </div>

            {/* Confirm or enter code */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-mono text-slate-300">
                  Enter 6-digit confirmation code (Optional / or tap Approve on phone):
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="e.g. 524190"
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/20 text-center font-mono text-base font-bold tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <button
                type="button"
                disabled={isSubmitting || phoneNotificationState === "APPROVED"}
                onClick={handleConfirmPhoneApproval}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-[var(--htb-green)] to-emerald-600 text-black font-extrabold text-xs font-mono uppercase tracking-wider shadow-lg hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {phoneNotificationState === "CONFIRMING" ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deducting Rs. {currentPricePKR} PKR & Unlocking...</span>
                  </>
                ) : phoneNotificationState === "APPROVED" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    <span>Payment Approved!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>I Approved on My Phone & Deduct Rs. {currentPricePKR} PKR</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowPhoneApprovalModal(false)}
                className="w-full py-1 text-center text-xs font-mono text-slate-400 hover:text-white transition-colors"
              >
                Cancel Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
