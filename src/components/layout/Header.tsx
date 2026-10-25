import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth/session";
import { Shield, Search, PenLine, User, LogOut, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNav } from "./MobileNav";

export async function Header() {
  const user = await getCurrentUser();

  const navLinks = [
    { label: "Cheatsheets", href: "/cheatsheets" },
    { label: "Articles", href: "/articles" },
    { label: "Research", href: "/research" },
    { label: "Vulnerabilities", href: "/vulnerabilities" },
    { label: "Write-ups", href: "/writeups" },
    { label: "Knowledge Base", href: "/knowledge" },
    { label: "Community", href: "/community" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--surface-border)] bg-[var(--surface-dropdown)] backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-[var(--surface-border)] bg-[var(--surface-card)] flex items-center justify-center group-hover:border-[var(--htb-green)] group-hover:shadow-[0_0_15px_var(--htb-green-glow)] transition-all flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Index 389 Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                priority
              />
            </div>
            <div>
              <span className="font-mono font-bold text-sm sm:text-base lg:text-lg tracking-wider text-[var(--foreground-bright)] flex items-center gap-1">
                INDEX <span className="text-[var(--htb-green)]">389</span>
              </span>
              <span className="hidden sm:block text-[9px] sm:text-[10px] font-mono tracking-widest text-[var(--foreground-muted)] uppercase -mt-0.5 sm:-mt-1">
                SEC_RESEARCH & INTEL
              </span>
            </div>
          </Link>

          {/* Desktop Nav (Only on wide screens xl:flex to prevent wrapping/crowding at 100% view) */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--foreground)] hover:text-[var(--htb-green)] hover:bg-[var(--surface-card)] transition-colors font-mono whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Medium and Large screen navigation dropdown or links */}
        <div className="hidden lg:flex xl:hidden items-center gap-1">
          {navLinks.slice(0, 4).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-2 py-1 rounded-md text-xs font-medium text-[var(--foreground)] hover:text-[var(--htb-green)] hover:bg-[var(--surface-card)] transition-colors font-mono whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/cheatsheets"
            className="px-2 py-1 rounded-md text-xs font-medium text-[var(--foreground)] hover:text-[var(--htb-green)] hover:bg-[var(--surface-card)] transition-colors font-mono whitespace-nowrap"
          >
            More...
          </Link>
        </div>

        {/* Desktop & Laptop Actions */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-3 flex-shrink-0">
          {/* Global Search */}
          <Link
            href="/search"
            aria-label="Search repository records"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[var(--surface-card)] border border-[var(--surface-border)] text-xs text-[var(--foreground)] hover:border-[var(--htb-green)]/60 transition-all font-mono"
          >
            <Search className="w-3.5 h-3.5 text-[var(--htb-green)]" />
            <span className="hidden xl:inline text-xs">Search records...</span>
            <kbd className="hidden xl:inline-block px-1.5 py-0.2 rounded bg-[var(--surface-elevated)] text-[10px] text-[var(--foreground-muted)] border border-[var(--surface-border)]">
              /
            </kbd>
          </Link>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Write / Admin action */}
          {user && ["ADMIN", "EDITOR", "AUTHOR"].includes(user.role) && (
            <Link
              href="/dashboard/articles/new"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--htb-green)] text-white dark:text-[#0b121e] hover:opacity-90 transition-opacity text-xs font-bold font-mono shadow-sm whitespace-nowrap"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>Write</span>
            </Link>
          )}

          {/* User Profile / Auth */}
          {user ? (
            <div className="flex items-center gap-1.5 xl:gap-2">
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="px-2 py-1.5 rounded-md bg-[var(--surface-card)] border border-[var(--surface-border)] hover:border-[var(--htb-green)]/40 text-[var(--foreground)] text-xs font-medium flex items-center gap-1.5 font-mono"
                  title="Admin Console"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[var(--htb-green)]" />
                  <span className="hidden xl:inline">Admin</span>
                </Link>
              )}

              <Link
                href="/profile"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--surface-card)] border border-[var(--surface-border)] hover:border-[var(--htb-green)]/40 text-[var(--foreground)] text-xs font-medium font-mono"
              >
                <User className="w-3.5 h-3.5 text-[var(--htb-green)]" />
                <span className="max-w-[100px] xl:max-w-[130px] truncate text-xs">{user.name}</span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono bg-[var(--surface-elevated)] text-[var(--htb-green)] border border-[var(--surface-border)] uppercase font-bold">
                  {user.role}
                </span>
              </Link>

              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  title="Sign out"
                  className="p-1.5 rounded-md text-[var(--foreground-muted)] hover:text-[#ff3366] hover:bg-[var(--surface-card)] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--foreground)] hover:text-[var(--htb-green)] hover:bg-[var(--surface-card)] transition-colors font-mono"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 rounded-md text-xs font-bold bg-[var(--htb-green)] text-white dark:text-[#0b121e] hover:opacity-90 transition-all font-mono shadow-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile & Tablet Navigation Drawer (< lg screens) */}
        <div className="flex lg:hidden items-center gap-2">
          <MobileNav user={user} navLinks={navLinks} />
        </div>
      </div>
    </header>
  );
}
