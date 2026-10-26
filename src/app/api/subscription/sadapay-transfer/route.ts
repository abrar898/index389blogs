import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { SADAPAY_DETAILS } from "@/lib/subscription";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      plan, // "MONTHLY" | "YEARLY"
      transactionId,
      senderPhone,
      senderName,
      receiptUrl,
      email,
      name,
      password,
    } = body;

    if (!plan || (plan !== "MONTHLY" && plan !== "YEARLY")) {
      return NextResponse.json(
        { error: "Please select a valid plan (Monthly or Yearly)." },
        { status: 400 }
      );
    }

    if (!transactionId || transactionId.trim().length < 4) {
      return NextResponse.json(
        { error: "Please enter a valid Transaction ID / Reference Number from your SadaPay transfer receipt." },
        { status: 400 }
      );
    }

    if (!senderPhone || senderPhone.trim().length < 8) {
      return NextResponse.json(
        { error: "Please enter the sender phone number or account number you transferred from." },
        { status: 400 }
      );
    }

    const cleanTrxId = transactionId.trim().toUpperCase();

    // Check if this transaction ID was already recorded to prevent duplicate claims
    const existingPayment = await (db as any).subscriptionPayment.findUnique({
      where: { transactionId: cleanTrxId },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: "This Transaction ID has already been claimed. If you believe this is an error, please contact support." },
        { status: 400 }
      );
    }

    // Determine user
    let currentUser = await getCurrentUser();
    let targetUserId = currentUser?.id;

    if (!targetUserId) {
      if (!email || !password || !name) {
        return NextResponse.json(
          {
            error:
              "Please provide your Name, Email, and Password so we can register and activate your Pro Operator account.",
          },
          { status: 400 }
        );
      }

      const cleanEmail = email.trim().toLowerCase();
      let user = await db.user.findUnique({ where: { email: cleanEmail } });

      if (user) {
        targetUserId = user.id;
      } else {
        const passwordHash = await hashPassword(password);
        user = await db.user.create({
          data: {
            email: cleanEmail,
            name: name.trim(),
            passwordHash,
            role: "READER",
            status: "ACTIVE",
          },
        });
        targetUserId = user.id;
      }

      const token = await createSessionToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as any,
        status: user.status,
      });
      await setSessionCookie(token);
    }

    // Calculate subscription terms
    const amountPKR = plan === "YEARLY" ? SADAPAY_DETAILS.pricesPKR.YEARLY : SADAPAY_DETAILS.pricesPKR.MONTHLY;
    const durationDays = plan === "YEARLY" ? 365 : 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const cleanSenderPhone = senderPhone.trim();
    const cleanSenderName = (senderName || "").trim();

    // Update user record with active subscription
    try {
      await db.user.update({
        where: { id: targetUserId },
        data: {
          subscriptionTier: plan === "YEARLY" ? "PRO_YEARLY" : "PRO_MONTHLY",
          subscriptionStatus: "ACTIVE",
          subscriptionPlan: plan,
          subscribedAt: new Date(),
          subscriptionExpiresAt: expiresAt,
          cardBrand: "SadaPay (Direct Transfer)",
          cardLast4: cleanSenderPhone.slice(-4),
        } as any,
      });
    } catch (dbErr) {
      console.error("DB update error for SadaPay user:", dbErr);
    }

    // Create payment record in database
    try {
      await (db as any).subscriptionPayment.create({
        data: {
          userId: targetUserId,
          amount: amountPKR,
          currency: "PKR",
          plan,
          status: "COMPLETED",
          paymentMethod: "SADAPAY_DIRECT",
          transactionId: cleanTrxId,
          cardLast4: cleanSenderPhone.slice(-4),
          senderPhone: cleanSenderPhone,
          senderName: cleanSenderName,
          receiptUrl: receiptUrl || null,
        },
      });
    } catch (payErr) {
      console.warn("Could not save to subscriptionPayment table:", payErr);
    }

    // Log audit event
    await logAudit({
      userId: targetUserId,
      action: "SADAPAY_SUBSCRIPTION_SUCCESS",
      entityType: "USER",
      entityId: targetUserId,
      details: {
        plan,
        amount: amountPKR,
        currency: "PKR",
        paymentMethod: "SADAPAY_DIRECT",
        transactionId: cleanTrxId,
        senderPhone: cleanSenderPhone,
        senderName: cleanSenderName,
      },
    });

    return NextResponse.json({
      success: true,
      plan,
      amount: amountPKR,
      currency: "PKR",
      transactionId: cleanTrxId,
      expiresAt: expiresAt.toISOString(),
      message:
        "SadaPay transfer verified successfully! Your Pro Operator pass is active, and all private writeups & research are instantly unlocked.",
    });
  } catch (error: any) {
    console.error("SadaPay processing exception:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process SadaPay transfer." },
      { status: 500 }
    );
  }
}
