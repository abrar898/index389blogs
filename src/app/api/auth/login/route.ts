import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;
    const redirectTo = (formData.get("redirectTo") as string) || "/";

    if (!email || !password) {
      return NextResponse.redirect(new URL("/login?error=Missing+credentials", req.url), 303);
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.redirect(new URL("/login?error=Invalid+email+or+password", req.url), 303);
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.redirect(new URL("/login?error=Account+is+suspended", req.url), 303);
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.redirect(new URL("/login?error=Invalid+email+or+password", req.url), 303);
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      status: user.status,
    });

    await setSessionCookie(token);

    await logAudit({
      userId: user.id,
      action: "USER_LOGIN_SUCCESS",
      entityType: "USER",
      entityId: user.id,
      details: { email: user.email },
    });

    return NextResponse.redirect(new URL(redirectTo, req.url), 303);
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.redirect(new URL("/login?error=Server+error", req.url), 303);
  }
}
