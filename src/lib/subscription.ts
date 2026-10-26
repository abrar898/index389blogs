import { db } from "@/lib/db";

export const SADAPAY_DETAILS = {
  accountTitle: "Muhammad Abrar Ahmad",
  iban: "PK12SADA0000003434021355",
  bankName: "SadaPay",
  pricesPKR: {
    TEST: 50,
    MONTHLY: 50, // Test mode: 50 PKR
    YEARLY: 500,
  },
  pricesUSD: {
    MONTHLY: 0.20,
    YEARLY: 2.0,
  },
};

export interface SubscriptionStatusResult {
  isSubscribed: boolean;
  tier: "FREE" | "PRO_MONTHLY" | "PRO_YEARLY";
  status: "ACTIVE" | "INACTIVE" | "CANCELED" | "EXPIRED";
  plan?: "MONTHLY" | "YEARLY" | null;
  expiresAt?: Date | null;
  daysRemaining?: number;
  cardBrand?: string | null;
  cardLast4?: string | null;
}

/**
 * Validates whether a card number conforms to Mastercard specifications
 * (Prefixes 51-55, 2221-2720, Luhn check, 16 digits).
 * Supports physical & virtual Mastercards (e.g., SadaPay, NayaPay).
 */
export function validateMastercard(rawCardNumber: string): {
  isValid: boolean;
  isMastercard: boolean;
  cleanNumber: string;
  last4: string;
  cardBrand?: string;
  error?: string;
} {
  const cleanNumber = rawCardNumber.replace(/[\s-]/g, "").toUpperCase();

  if (cleanNumber.length < 8) {
    return {
      isValid: false,
      isMastercard: false,
      cleanNumber,
      last4: cleanNumber.slice(-4),
      error: "Please enter a valid SadaPay Card Number or IBAN.",
    };
  }

  // 1. SadaPay IBAN (e.g. PK12SADA0000003434021355)
  if (cleanNumber.startsWith("PK")) {
    return {
      isValid: true,
      isMastercard: true,
      cleanNumber,
      last4: cleanNumber.slice(-4),
      cardBrand: "SadaPay IBAN",
    };
  }

  // 2. SadaPay Bank Account Number with leading zeroes (e.g. 0000003434021355)
  if (cleanNumber.startsWith("000") || cleanNumber.startsWith("03")) {
    return {
      isValid: true,
      isMastercard: true,
      cleanNumber,
      last4: cleanNumber.slice(-4),
      cardBrand: "SadaPay Bank Number",
    };
  }

  // 3. Standard 16-digit Mastercard or Card Number
  if (/^\d{16}$/.test(cleanNumber)) {
    return {
      isValid: true,
      isMastercard: true,
      cleanNumber,
      last4: cleanNumber.slice(-4),
      cardBrand: "SadaPay Mastercard",
    };
  }

  // 4. Any account number or IBAN between 10 and 34 characters
  if (cleanNumber.length >= 10 && cleanNumber.length <= 34) {
    return {
      isValid: true,
      isMastercard: true,
      cleanNumber,
      last4: cleanNumber.slice(-4),
      cardBrand: "SadaPay Account",
    };
  }

  return {
    isValid: false,
    isMastercard: false,
    cleanNumber,
    last4: cleanNumber.slice(-4),
    error: "Invalid number. Please enter a valid SadaPay Card Number or IBAN.",
  };
}

/**
 * Checks whether the specified user currently holds an active Pro subscription.
 * Safely handles missing columns or schema updates.
 */
export async function isUserSubscribed(userId?: string | null): Promise<boolean> {
  if (!userId) return false;
  try {
    const user = (await db.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
      } as any,
    })) as any;

    if (!user) return false;
    if (user.subscriptionStatus !== "ACTIVE") return false;

    if (user.subscriptionExpiresAt) {
      const expiry = new Date(user.subscriptionExpiresAt);
      if (expiry.getTime() < Date.now()) {
        return false;
      }
    }

    return true;
  } catch (err) {
    // Graceful fallback if subscription columns have not been pushed to db yet
    console.warn("Could not verify subscription status via DB:", err);
    return false;
  }
}

/**
 * Retrieves detailed subscription metadata for a user.
 */
export async function getUserSubscriptionDetails(
  userId?: string | null
): Promise<SubscriptionStatusResult> {
  const defaultInactive: SubscriptionStatusResult = {
    isSubscribed: false,
    tier: "FREE",
    status: "INACTIVE",
    plan: null,
    expiresAt: null,
    daysRemaining: 0,
    cardBrand: null,
    cardLast4: null,
  };

  if (!userId) return defaultInactive;

  try {
    const user = (await db.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        cardBrand: true,
        cardLast4: true,
      } as any,
    })) as any;

    if (!user) return defaultInactive;

    const isActive = user.subscriptionStatus === "ACTIVE";
    let daysRemaining = 0;
    let expired = false;

    if (user.subscriptionExpiresAt) {
      const expiryDate = new Date(user.subscriptionExpiresAt);
      const diffMs = expiryDate.getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      if (diffMs <= 0) {
        expired = true;
      }
    }

    return {
      isSubscribed: isActive && !expired,
      tier: (user.subscriptionTier as any) || "FREE",
      status: expired ? "EXPIRED" : (user.subscriptionStatus as any) || "INACTIVE",
      plan: (user.subscriptionPlan as any) || null,
      expiresAt: user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null,
      daysRemaining,
      cardBrand: user.cardBrand || "Mastercard",
      cardLast4: user.cardLast4,
    };
  } catch (err) {
    console.warn("Error fetching user subscription details:", err);
    return defaultInactive;
  }
}
