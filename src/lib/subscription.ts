import { db } from "@/lib/db";

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
  error?: string;
} {
  const cleanNumber = rawCardNumber.replace(/[\s-]/g, "");

  if (!/^\d+$/.test(cleanNumber)) {
    return {
      isValid: false,
      isMastercard: false,
      cleanNumber,
      last4: "",
      error: "Card number must contain only numbers.",
    };
  }

  if (cleanNumber.length !== 16) {
    return {
      isValid: false,
      isMastercard: false,
      cleanNumber,
      last4: cleanNumber.slice(-4),
      error: "Mastercard numbers must be exactly 16 digits.",
    };
  }

  // Mastercard BIN ranges:
  // - 51 to 55
  // - 2221 to 2720 (modern 2-series range, commonly used by SadaPay & virtual debit cards)
  const prefix2 = parseInt(cleanNumber.slice(0, 2), 10);
  const prefix4 = parseInt(cleanNumber.slice(0, 4), 10);

  const is5Series = prefix2 >= 51 && prefix2 <= 55;
  const is2Series = prefix4 >= 2221 && prefix4 <= 2720;
  const isMastercard = is5Series || is2Series;

  if (!isMastercard) {
    return {
      isValid: false,
      isMastercard: false,
      cleanNumber,
      last4: cleanNumber.slice(-4),
      error: "Only Mastercard is accepted (e.g. SadaPay or standard Mastercard).",
    };
  }

  // Luhn Algorithm check
  let sum = 0;
  let alternate = false;
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i), 10);
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }

  if (sum % 10 !== 0) {
    return {
      isValid: false,
      isMastercard: true,
      cleanNumber,
      last4: cleanNumber.slice(-4),
      error: "Invalid card number checksum. Please verify card details.",
    };
  }

  return {
    isValid: true,
    isMastercard: true,
    cleanNumber,
    last4: cleanNumber.slice(-4),
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
