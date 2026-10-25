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
  navLinks: {
    label: string;
    href: string;
  }[];
}

export function MobileNav({ user, navLinks }: MobileNavProps) {
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
        className="p-2 rounded-lg border border-[#333355] bg-[#25253E] text-white hover:text-[#9FEF00] hover:border-[#9FEF00]/50 transition-colors"
      >
        {isOpen ? <X className="w-5 h-5 text-[#FF4D4D]" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="fixed inset-x-0 top-16 z-50 p-4 border-b border-[#2A2A44] bg-[#1A1A2E]/98 backdrop-blur-xl shadow-2xl transition-all animate-in slide-in-from-top-2">
          <div className="flex flex-col space-y-3">
            {/* Search Input Link */}
            <Link
              href="/search"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-[#25253E] border border-[#333355] text-xs text-[#9A9AB0] hover:text-white font-mono"
            >
              <Search className="w-4 h-4 text-[#9FEF00]" />
              <span>Search research & CVEs...</span>
            </Link>

            {/* Navigation Links */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2A2A44]">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-mono font-medium text-white hover:text-[#9FEF00] bg-[#25253E] border border-[#333355] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* User or Auth Links */}
            <div className="pt-2 border-t border-[#2A2A44]">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#25253E] border border-[#333355]">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#9FEF00]" />
                      <span className="text-xs font-mono font-semibold text-white">
                        {user.name}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#1A1A2E] text-[#9FEF00] border border-[#333355] uppercase font-bold">
                      {user.role}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {["ADMIN", "EDITOR", "AUTHOR"].includes(user.role) && (
                      <Link
                        href="/dashboard/articles/new"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#9FEF00] hover:bg-[#77C400] text-[#0D0D1A] font-bold text-xs font-mono shadow-[0_0_12px_rgba(159,239,0,0.3)]"
                      >
                        <PenLine className="w-3.5 h-3.5" />
                        <span>Write</span>
                      </Link>
                    )}

                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#25253E] border border-[#333355] text-xs font-mono text-white"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-[#9FEF00]" />
                        <span>Admin</span>
                      </Link>
                    )}

                    <Link
                      href="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#25253E] border border-[#333355] text-xs font-mono text-white"
                    >
                      <User className="w-3.5 h-3.5 text-[#00B4D8]" />
                      <span>Profile</span>
                    </Link>

                    <form action="/api/auth/logout" method="POST" className="w-full">
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-950/60 border border-[#FF4D4D]/40 text-[#FF4D4D] text-xs font-mono hover:bg-red-900/40"
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
                    className="flex items-center justify-center py-2 px-3 rounded-lg border border-[#333355] bg-[#25253E] text-xs font-mono font-medium text-white hover:text-[#9FEF00]"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center py-2 px-3 rounded-lg bg-[#9FEF00] hover:bg-[#77C400] text-[#0D0D1A] text-xs font-mono font-bold shadow-[0_0_12px_rgba(159,239,0,0.3)]"
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
