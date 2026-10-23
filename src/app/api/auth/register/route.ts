import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
      return NextResponse.redirect(new URL("/register?error=All+fields+are+required", req.url), 303);
    }

    if (password.length < 8) {
      return NextResponse.redirect(new URL("/register?error=Password+must+be+at+least+8+characters", req.url), 303);
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.redirect(new URL("/register?error=Email+already+registered", req.url), 303);
    }

    const requestedRole = (formData.get("role") as string)?.toUpperCase();
    // Only allow "AUTHOR" or "READER" (Student). Strictly prohibit "ADMIN", "EDITOR", or "MODERATOR" via public register
    const role = requestedRole === "AUTHOR" ? "AUTHOR" : "READER";

    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        status: "ACTIVE",
        profile: {
          create: {
            isPublic: true,
          },
        },
      },
    });

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
      action: "USER_REGISTER",
      entityType: "USER",
      entityId: user.id,
      details: { email: user.email },
    });

    return NextResponse.redirect(new URL("/profile", req.url), 303);
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.redirect(new URL("/register?error=Server+error", req.url), 303);
  }
}
