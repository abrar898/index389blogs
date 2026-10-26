import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserSubscriptionDetails } from "@/lib/subscription";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({
        isLoggedIn: false,
        isSubscribed: false,
        tier: "FREE",
        status: "INACTIVE",
      });
    }

    const subDetails = await getUserSubscriptionDetails(currentUser.id);

    return NextResponse.json({
      isLoggedIn: true,
      user: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
      },
      ...subDetails,
    });
  } catch (error: any) {
    console.error("Error fetching subscription status:", error);
    return NextResponse.json(
      { error: "Failed to retrieve subscription status." },
      { status: 500 }
    );
  }
}
