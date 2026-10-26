"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Shield, Search, PenLine, User, LogOut, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface MobileNavProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  isSubscribed?: boolean;
  navLinks: {
    label: string;
    href: string;
  }[];
}

export function MobileNav({ user, isSubscribed, navLinks }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex lg:hidden items-center gap-2">
      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Hamburger Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
        className="p-2 rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] text-[var(--foreground)] hover:text-[#9fef00] hover:border-[#9fef00]/50 transition-colors"
      >
        {isOpen ? <X className="w-5 h-5 text-[#ff3366]" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="fixed inset-x-0 top-16 z-50 p-4 border-b border-[var(--surface-border)] bg-[var(--surface-dropdown)] backdrop-blur-xl shadow-2xl transition-all animate-in slide-in-from-top-2">
          <div className="flex flex-col space-y-3">
            {/* Search Input Link */}
            <Link
              href="/search"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-[var(--surface-card)] border border-[var(--surface-border)] text-xs text-[var(--foreground)] hover:text-[#9fef00] font-mono"
            >
              <Search className="w-4 h-4 text-[#9fef00]" />
              <span>Search research & CVEs...</span>
            </Link>

            {/* Navigation Links */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--surface-border)]">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-mono font-medium text-[var(--foreground)] hover:text-[#9fef00] bg-[var(--surface-card)] border border-[var(--surface-border)] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* User or Auth Links */}
            <div className="pt-2 border-t border-[var(--surface-border)]">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--surface-card)] border border-[var(--surface-border)]">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#9fef00]" />
                      <span className="text-xs font-mono font-semibold text-[var(--foreground)]">
                        {user.name}
                      </span>
                    </div>
                    {isSubscribed ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#e8fff0] dark:bg-[#9fef00]/15 text-[#3b6b00] dark:text-[#9fef00] border border-[var(--htb-green)] uppercase font-bold">
                        ⚡ PRO
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#14233c] text-[#9fef00] border border-[#9fef00]/30 uppercase font-bold">
                        {user.role}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {["ADMIN", "EDITOR", "AUTHOR"].includes(user.role) && (
                      <Link
                        href="/dashboard/articles/new"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--htb-green)] text-white dark:text-[#0b121e] font-bold text-xs font-mono shadow-sm"
                      >
                        <PenLine className="w-3.5 h-3.5" />
                        <span>Write</span>
                      </Link>
                    )}

                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--surface-card)] border border-[var(--surface-border)] text-xs font-mono text-[var(--foreground)]"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-[#9fef00]" />
                        <span>Admin</span>
                      </Link>
                    )}

                    <Link
                      href="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--surface-card)] border border-[var(--surface-border)] text-xs font-mono text-[var(--foreground)]"
                    >
                      <User className="w-3.5 h-3.5 text-[#2de2e6]" />
                      <span>Profile</span>
                    </Link>

                    <form action="/api/auth/logout" method="POST" className="w-full">
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-900/20 border border-red-500/30 text-[#ff3366] text-xs font-mono hover:bg-red-900/40"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center py-2 px-3 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] text-xs font-mono font-medium text-[var(--foreground)] hover:text-[#9fef00]"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center py-2 px-3 rounded-lg bg-[var(--htb-green)] text-white dark:text-[#0b121e] text-xs font-mono font-bold hover:opacity-90 shadow-sm"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
