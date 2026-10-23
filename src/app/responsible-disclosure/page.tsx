import { Shield, Key, Mail, Lock } from "lucide-react";

export const metadata = {
  title: "Responsible Vulnerability Disclosure — CyberVault",
  description: "Guidelines and encrypted communication channels for coordinated vulnerability disclosure.",
};

export default function ResponsibleDisclosurePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 font-sans">
      <div className="border-b border-[#1f3352] pb-6">
        <h1 className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
          RESPONSIBLE VULNERABILITY DISCLOSURE
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Coordinated disclosure timeline, safe harbor, and reporting protocols.
        </p>
      </div>

      <div className="article-prose space-y-6 text-sm text-slate-300 leading-relaxed">
        <h2 className="text-base font-bold font-mono text-[#9fef00]">1. Safe Harbor Policy</h2>
        <p>
          We fully support security researchers reporting security flaws discovered within CyberVault platform infrastructure. If you conduct vulnerability research in good faith in accordance with this policy, we consider your actions authorized.
        </p>

        <h2 className="text-base font-bold font-mono text-[#9fef00]">2. Coordinated Disclosure Guidelines</h2>
        <ul className="space-y-2 list-disc pl-5">
          <li>Do not access, destroy, or exfiltrate private user notes or platform customer data.</li>
          <li>Avoid disruption of production services (no denial of service or brute-forcing rate limits).</li>
          <li>Provide a minimum 90-day grace period for remediation before public release of vulnerability details.</li>
        </ul>

        <h2 className="text-base font-bold font-mono text-[#9fef00]">3. Reporting Channel</h2>
        <p>
          Send encrypted reports with complete reproduction steps to <code className="text-[#9fef00] bg-[#0b121e] px-1.5 py-0.5 rounded border border-[#1f3352]">security@cybervault.local</code>. Include your PGP public key for reciprocal encrypted responses.
        </p>
      </div>
    </div>
  );
}
