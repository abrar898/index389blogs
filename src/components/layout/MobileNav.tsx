"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Shield,
  Search,
  PenLine,
  User,
  LogOut,
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Folder,
  Terminal,
  Zap,
  Users,
  FileText,
} from "lucide-react";
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
    iconName?: string;
  }[];
}

function renderMobileNavIcon(iconName?: string) {
  switch (iconName) {
    case "articles":
      return <FileText className="w-3.5 h-3.5 text-[var(--htb-green)] group-hover:text-white flex-shrink-0 transition-colors" />;
    case "research":
      return <CheckSquare className="w-3.5 h-3.5 text-[var(--htb-green)] group-hover:text-white flex-shrink-0 transition-colors" />;
    case "vulnerabilities":
      return <Folder className="w-3.5 h-3.5 text-[var(--htb-green)] group-hover:text-white flex-shrink-0 transition-colors" />;
    case "writeups":
      return <Shield className="w-3.5 h-3.5 text-[var(--htb-green)] group-hover:text-white flex-shrink-0 transition-colors" />;
    case "knowledge":
      return <BookOpen className="w-3.5 h-3.5 text-[var(--htb-green)] group-hover:text-white flex-shrink-0 transition-colors" />;
    case "community":
      return <Users className="w-3.5 h-3.5 text-[var(--htb-green)] group-hover:text-white flex-shrink-0 transition-colors" />;
    case "pricing":
      return <Zap className="w-3.5 h-3.5 text-[var(--htb-green)] group-hover:text-white flex-shrink-0 transition-colors" />;
    case "cheatsheets":
      return <Terminal className="w-3.5 h-3.5 text-[var(--htb-green)] group-hover:text-white flex-shrink-0 transition-colors" />;
    default:
      return null;
  }
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
        className="p-2 rounded-lg border border-[#1f3352] bg-[#14233c] text-[var(--htb-green)] hover:border-[var(--htb-green)]/60 transition-colors shadow-sm"
      >
        {isOpen ? <X className="w-5 h-5 text-[#ff3366]" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="fixed inset-x-0 top-16 z-50 p-4 border-b border-[#1f3352] bg-[#0b121e]/98 backdrop-blur-xl shadow-2xl transition-all animate-in slide-in-from-top-2">
          <div className="flex flex-col space-y-3">
            {/* Search Input Link */}
            <Link
              href="/search"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-[#14233c] border border-[#1f3352] text-xs text-slate-200 hover:text-[var(--htb-green)] font-mono"
            >
              <Search className="w-4 h-4 text-[var(--htb-green)]" />
              <span>Search research & CVEs...</span>
            </Link>

            {/* Navigation Links with Icons & Neon Green Styling */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1f3352]">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-[var(--htb-green)] hover:text-white bg-[#14233c] border border-[#1f3352] hover:border-[var(--htb-green)]/50 transition-colors group"
                >
                  {renderMobileNavIcon(link.iconName)}
                  <span className="truncate">{link.label}</span>
                </Link>
              ))}
            </div>

            {/* User or Auth Links */}
            <div className="pt-2 border-t border-[#1f3352]">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#14233c] border border-[#1f3352]">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[var(--htb-green)]" />
                      <span className="text-xs font-mono font-semibold text-slate-200">
                        {user.name}
                      </span>
                    </div>
                    {isSubscribed ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#e8fff0] dark:bg-[#9fef00]/15 text-[#3b6b00] dark:text-[#9fef00] border border-[var(--htb-green)] uppercase font-bold">
                        ⚡ PRO
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#0b121e] text-[var(--htb-green)] border border-[#1f3352] uppercase font-bold">
                        {user.role}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {["ADMIN", "EDITOR", "AUTHOR"].includes(user.role) && (
                      <Link
                        href="/dashboard/articles/new"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--htb-green)] text-[#0b121e] font-bold text-xs font-mono shadow-sm uppercase tracking-wider"
                      >
                        <PenLine className="w-3.5 h-3.5" />
                        <span>Write</span>
                      </Link>
                    )}

                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#14233c] border border-[#1f3352] text-xs font-mono text-slate-200 hover:text-white"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-[var(--htb-green)]" />
                        <span>Admin</span>
                      </Link>
                    )}

                    <Link
                      href="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#14233c] border border-[#1f3352] text-xs font-mono text-slate-200 hover:text-white"
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
                    className="flex items-center justify-center py-2 px-3 rounded-lg border border-[#1f3352] bg-[#14233c] text-xs font-mono font-bold text-slate-200 hover:text-[var(--htb-green)] uppercase tracking-wider"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center py-2 px-3 rounded-lg bg-[var(--htb-green)] text-[#0b121e] text-xs font-mono font-bold hover:opacity-90 shadow-sm uppercase tracking-wider"
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
