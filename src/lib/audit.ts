import { db } from "./db";

export interface LogAuditParams {
  userId?: string | null;
  action: string;
  entityType: "ARTICLE" | "USER" | "CVE" | "WRITEUP" | "KNOWLEDGE" | "COMMENT" | "DISCUSSION" | "SYSTEM";
  entityId?: string | null;
  details?: Record<string, unknown> | string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logAudit(params: LogAuditParams) {
  try {
    const detailsStr =
      typeof params.details === "object"
        ? JSON.stringify(params.details)
        : params.details;

    await db.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: detailsStr,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (err) {
    console.error("Failed to log audit event:", err);
  }
}
