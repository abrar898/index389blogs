import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/rbac";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser || !isAdmin(currentUser)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const role = (formData.get("role") as string)?.toUpperCase();
    const status = (formData.get("status") as string)?.toUpperCase();

    const validRoles = ["ADMIN", "EDITOR", "AUTHOR", "READER", "MODERATOR"];
    const validStatuses = ["ACTIVE", "SUSPENDED"];

    const updateData: any = {};
    if (role && validRoles.includes(role)) updateData.role = role;
    if (status && validStatuses.includes(status)) updateData.status = status;

    const user = await db.user.update({
      where: { id },
      data: updateData,
    });

    await logAudit({
      userId: currentUser.id,
      action: "USER_ROLE_CHANGE",
      entityType: "USER",
      entityId: user.id,
      details: { newRole: user.role, newStatus: user.status, targetEmail: user.email },
    });

    return NextResponse.redirect(new URL("/admin/users?success=User+updated", req.url), 303);
  } catch (err: any) {
    console.error("Update user error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
