import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth/session";
import { isUserSubscribed } from "@/lib/subscription";
import {
  Shield,
  Search,
  PenLine,
  User,
  LogOut,
  LayoutDashboard,
  Zap,
  BookOpen,
  CheckSquare,
  Folder,
  Terminal,
  Users,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNav } from "./MobileNav";

export async function Header() {
  const user = await getCurrentUser();
  const isSubscribed = await isUserSubscribed(user?.id);

  const navLinks = [
    { label: "REPOSITORY", href: "/articles", icon: BookOpen },
    { label: "METHODOLOGY", href: "/research", icon: CheckSquare },
    { label: "TAXONOMY", href: "/vulnerabilities", icon: Folder },
    { label: "CHEATSHEETS", href: "/cheatsheets", icon: Terminal },
    { label: "WRITE-UPS", href: "/writeups", icon: Shield },
    { label: "PRICING", href: "/subscribe", icon: Zap },
    { label: "COMMUNITY", href: "/community", icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1f3352] bg-[#0b121e]/95 backdrop-blur-md transition-colors shadow-[0_1px_15px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-[#1f3352] bg-[#14233c] flex items-center justify-center group-hover:border-[var(--htb-green)] group-hover:shadow-[0_0_15px_var(--htb-green-glow)] transition-all flex-shrink-0">
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
              <span className="font-mono font-bold text-sm sm:text-base lg:text-lg tracking-wider text-white flex items-center gap-1">
                INDEX <span className="text-[var(--htb-green)]">389</span>
              </span>
              <span className="hidden sm:block text-[9px] sm:text-[10px] font-mono tracking-widest text-slate-400 uppercase -mt-0.5 sm:-mt-1">
                SEC_RESEARCH & INTEL
              </span>
            </div>
          </Link>

          {/* Desktop Nav: Vibrant HTB Neon Green Icons + Uppercase Monospace Labels */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono font-bold uppercase tracking-wider text-[var(--htb-green)] hover:text-white hover:bg-[var(--htb-green)]/15 transition-all whitespace-nowrap group"
                >
                  <Icon className="w-3.5 h-3.5 text-[var(--htb-green)] group-hover:text-white transition-colors flex-shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Medium and Large screen navigation */}
        <div className="hidden lg:flex xl:hidden items-center gap-1">
          {navLinks.slice(0, 4).map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider text-[var(--htb-green)] hover:text-white hover:bg-[var(--htb-green)]/15 transition-all whitespace-nowrap group"
              >
                <Icon className="w-3.5 h-3.5 text-[var(--htb-green)] group-hover:text-white transition-colors flex-shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <Link
            href="/cheatsheets"
            className="px-2 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider text-[var(--htb-green)] hover:text-white hover:bg-[var(--htb-green)]/15 transition-all whitespace-nowrap"
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
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#14233c]/80 border border-[#1f3352] text-xs text-slate-200 hover:text-white hover:border-[var(--htb-green)]/60 transition-all font-mono"
          >
            <Search className="w-3.5 h-3.5 text-[var(--htb-green)]" />
            <span className="hidden xl:inline text-xs text-slate-300">Search records...</span>
            <kbd className="hidden xl:inline-block px-1.5 py-0.2 rounded bg-[#0b121e] text-[10px] text-slate-400 border border-[#1f3352]">
              /
            </kbd>
          </Link>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Upgrade to Pro button if not subscribed */}
          {!isSubscribed && (
            <Link
              href="/subscribe"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[var(--htb-green)]/50 bg-[var(--htb-green)]/10 text-[var(--htb-green)] hover:bg-[var(--htb-green)] hover:text-[#0b121e] text-xs font-mono font-bold transition-all shadow-sm whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span className="hidden xl:inline">Upgrade to Pro</span>
              <span className="xl:hidden">Pro</span>
            </Link>
          )}

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
                  className="px-2 py-1.5 rounded-md bg-[#14233c] border border-[#1f3352] hover:border-[var(--htb-green)]/40 text-slate-200 hover:text-white text-xs font-medium flex items-center gap-1.5 font-mono"
                  title="Admin Console"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[var(--htb-green)]" />
                  <span className="hidden xl:inline">Admin</span>
                </Link>
              )}

              <Link
                href="/profile"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#14233c] border border-[#1f3352] hover:border-[var(--htb-green)]/40 text-slate-200 hover:text-white text-xs font-medium font-mono"
              >
                <User className="w-3.5 h-3.5 text-[var(--htb-green)]" />
                <span className="max-w-[100px] xl:max-w-[130px] truncate text-xs text-slate-200">{user.name}</span>
                {isSubscribed ? (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#e8fff0] dark:bg-[#9fef00]/15 text-[#3b6b00] dark:text-[#9fef00] border border-[var(--htb-green)] uppercase font-bold">
                    ⚡ PRO
                  </span>
                ) : (
                  <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#0b121e] text-[var(--htb-green)] border border-[#1f3352] uppercase font-bold">
                    {user.role}
                  </span>
                )}
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
                className="px-3 py-1.5 rounded-md text-xs font-bold text-slate-200 hover:text-[var(--htb-green)] hover:bg-[#14233c] transition-colors font-mono uppercase tracking-wider"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 rounded-md text-xs font-bold bg-[var(--htb-green)] text-[#0b121e] hover:opacity-90 transition-all font-mono shadow-sm uppercase tracking-wider"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile & Tablet Navigation Drawer (< lg screens) */}
        <div className="flex lg:hidden items-center gap-2">
          <MobileNav user={user} isSubscribed={isSubscribed} navLinks={navLinks} />
        </div>
      </div>
    </header>
  );
}
