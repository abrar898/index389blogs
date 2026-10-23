import { getCurrentUser, SessionUser } from "../auth/session";

export type Role = "ADMIN" | "EDITOR" | "AUTHOR" | "READER" | "MODERATOR";

export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === "ADMIN";
}

export function isEditor(user: SessionUser | null): boolean {
  return user?.role === "EDITOR" || user?.role === "ADMIN";
}

export function isAuthor(user: SessionUser | null): boolean {
  return (
    user?.role === "AUTHOR" ||
    user?.role === "EDITOR" ||
    user?.role === "ADMIN"
  );
}

export function isModerator(user: SessionUser | null): boolean {
  return user?.role === "MODERATOR" || user?.role === "ADMIN";
}

export function canPublishContent(user: SessionUser | null): boolean {
  return user?.role === "ADMIN" || user?.role === "EDITOR";
}

export function canEditArticle(user: SessionUser | null, authorId: string): boolean {
  if (!user) return false;
  if (user.role === "ADMIN" || user.role === "EDITOR") return true;
  return user.role === "AUTHOR" && user.id === authorId;
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: Authentication required.");
  }
  if (user.status === "SUSPENDED") {
    throw new Error("FORBIDDEN: Account is suspended.");
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role as Role)) {
    throw new Error(`FORBIDDEN: Requires one of [${allowedRoles.join(", ")}] permissions.`);
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireRole(["ADMIN"]);
}

export async function requireEditor(): Promise<SessionUser> {
  return requireRole(["ADMIN", "EDITOR"]);
}

export async function requireAuthor(): Promise<SessionUser> {
  return requireRole(["ADMIN", "EDITOR", "AUTHOR"]);
}

export async function requireModerator(): Promise<SessionUser> {
  return requireRole(["ADMIN", "MODERATOR"]);
}
