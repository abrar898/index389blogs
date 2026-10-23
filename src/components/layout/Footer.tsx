import Link from "next/link";
import { Shield, ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-[#1f3352] bg-[#090e17] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand & mission */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#111d30] border border-[#1f3352] flex items-center justify-center text-[#9fef00]">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-mono font-bold text-base tracking-wider text-slate-100">
                INDEX <span className="text-[#9fef00]">389</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm font-sans">
              An independent cybersecurity research publication, vulnerability repository, and technical knowledge base dedicated to offensive verification, threat intelligence, and defensive hardening.
            </p>
            <div className="pt-2 text-xs font-mono text-slate-400 flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#9fef00] shadow-[0_0_8px_#9fef00] animate-pulse"></span>
              <span className="text-slate-300 font-semibold tracking-wider">ALL SYSTEMS OPERATIONAL</span>
            </div>
          </div>

          {/* Core Modules */}
          <div>
            <h4 className="text-xs font-mono font-bold text-[#9fef00] uppercase tracking-wider mb-3">
              Publications
            </h4>
            <ul className="space-y-2 text-xs text-slate-400 font-mono">
              <li>
                <Link href="/articles" className="hover:text-[#9fef00] transition-colors">
                  Technical Articles
                </Link>
              </li>
              <li>
                <Link href="/research" className="hover:text-[#9fef00] transition-colors">
                  Vulnerability Research
                </Link>
              </li>
              <li>
                <Link href="/vulnerabilities" className="hover:text-[#9fef00] transition-colors">
                  CVE Directory
                </Link>
              </li>
              <li>
                <Link href="/writeups" className="hover:text-[#9fef00] transition-colors">
                  Lab & CTF Write-ups
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-mono font-bold text-[#9fef00] uppercase tracking-wider mb-3">
              Resources
            </h4>
            <ul className="space-y-2 text-xs text-slate-400 font-mono">
              <li>
                <Link href="/knowledge" className="hover:text-[#9fef00] transition-colors">
                  Knowledge Base
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-[#9fef00] transition-colors">
                  Community Discussions
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-[#9fef00] transition-colors">
                  Global Search
                </Link>
              </li>
              <li>
                <Link href="/api/rss" className="hover:text-[#9fef00] transition-colors flex items-center gap-1">
                  RSS Feed <ArrowUpRight className="w-3 h-3 opacity-60" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Governance & Policies */}
          <div>
            <h4 className="text-xs font-mono font-bold text-[#9fef00] uppercase tracking-wider mb-3">
              Policy & Disclosure
            </h4>
            <ul className="space-y-2 text-xs text-slate-400 font-mono">
              <li>
                <Link href="/editorial-policy" className="hover:text-[#9fef00] transition-colors">
                  Editorial Policy
                </Link>
              </li>
              <li>
                <Link href="/responsible-disclosure" className="hover:text-[#9fef00] transition-colors">
                  Responsible Disclosure
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#9fef00] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#9fef00] transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-[#1f3352] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <p>© 2026 Index 389 Security Research. All rights reserved.</p>
          <p className="text-[11px] text-slate-500">
            For educational & defensive verification purposes only. Strictly authorized environments.
          </p>
        </div>
      </div>
    </footer>
  );
}
