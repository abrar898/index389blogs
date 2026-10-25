import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth/session";
import { Shield, Search, PenLine, User, LogOut, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNav } from "./MobileNav";

export async function Header() {
  const user = await getCurrentUser();

  const navLinks = [
    { label: "Articles", href: "/articles" },
    { label: "Research", href: "/research" },
    { label: "Vulnerabilities", href: "/vulnerabilities" },
    { label: "Write-ups", href: "/writeups" },
    { label: "Knowledge Base", href: "/knowledge" },
    { label: "Community", href: "/community" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1f3352] bg-[#0b121e]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-[#9fef00]/40 bg-[#090f19] flex items-center justify-center group-hover:border-[#9fef00] group-hover:shadow-[0_0_20px_rgba(159,239,0,0.45)] transition-all flex-shrink-0">
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
              <span className="font-mono font-bold text-sm sm:text-base lg:text-lg tracking-wider text-slate-100 flex items-center gap-1">
                INDEX <span className="text-[#9fef00]">389</span>
              </span>
              <span className="hidden sm:block text-[9px] sm:text-[10px] font-mono tracking-widest text-slate-400 uppercase -mt-0.5 sm:-mt-1">
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
                className="px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-[#9fef00] hover:bg-[#14233c] transition-colors font-mono whitespace-nowrap"
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
              className="px-2 py-1 rounded-md text-xs font-medium text-slate-300 hover:text-[#9fef00] hover:bg-[#14233c] transition-colors font-mono whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/knowledge"
            className="px-2 py-1 rounded-md text-xs font-medium text-slate-300 hover:text-[#9fef00] hover:bg-[#14233c] transition-colors font-mono whitespace-nowrap"
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
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#111d30] border border-[#1f3352] text-xs text-slate-300 hover:text-white hover:border-[#9fef00]/50 transition-all font-mono"
          >
            <Search className="w-3.5 h-3.5 text-[#9fef00]" />
            <span className="hidden xl:inline text-xs">Search records...</span>
            <kbd className="hidden xl:inline-block px-1.5 py-0.2 rounded bg-[#14233c] text-[10px] text-slate-400 border border-[#1f3352]">
              /
            </kbd>
          </Link>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Write / Admin action */}
          {user && ["ADMIN", "EDITOR", "AUTHOR"].includes(user.role) && (
            <Link
              href="/dashboard/articles/new"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#9fef00] hover:bg-[#b4fa1f] text-[#0b121e] transition-colors text-xs font-bold font-mono shadow-[0_0_12px_rgba(159,239,0,0.25)] whitespace-nowrap"
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
                  className="px-2 py-1.5 rounded-md bg-[#111d30] border border-[#1f3352] hover:border-[#9fef00]/40 text-slate-200 text-xs font-medium flex items-center gap-1.5 font-mono"
                  title="Admin Console"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#9fef00]" />
                  <span className="hidden xl:inline">Admin</span>
                </Link>
              )}

              <Link
                href="/profile"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#111d30] border border-[#1f3352] hover:border-[#9fef00]/40 text-slate-200 text-xs font-medium font-mono"
              >
                <User className="w-3.5 h-3.5 text-[#9fef00]" />
                <span className="max-w-[100px] xl:max-w-[130px] truncate text-xs">{user.name}</span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#14233c] text-[#9fef00] border border-[#9fef00]/30 uppercase font-bold">
                  {user.role}
                </span>
              </Link>

              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  title="Sign out"
                  className="p-1.5 rounded-md text-slate-400 hover:text-[#ff3366] hover:bg-[#14233c] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-[#9fef00] hover:bg-[#111d30] transition-colors font-mono"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 rounded-md text-xs font-bold bg-[#9fef00] text-[#0b121e] hover:bg-[#b4fa1f] transition-all font-mono shadow-[0_0_12px_rgba(159,239,0,0.25)]"
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
