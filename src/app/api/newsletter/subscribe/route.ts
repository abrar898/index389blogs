import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = (formData.get("email") as string)?.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.redirect(new URL("/?newsletter=invalid_email", req.url), 303);
    }

    await db.newsletterSubscriber.upsert({
      where: { email },
      update: { status: "SUBSCRIBED" },
      create: {
        email,
        status: "SUBSCRIBED",
        confirmedAt: new Date(),
      },
    });

    return NextResponse.redirect(new URL("/?newsletter=subscribed", req.url), 303);
  } catch (err: any) {
    console.error("Newsletter error:", err);
    return NextResponse.redirect(new URL("/?newsletter=error", req.url), 303);
  }
}
