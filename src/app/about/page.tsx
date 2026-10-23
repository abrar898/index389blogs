import { Shield, Target, BookOpen, Terminal } from "lucide-react";

export const metadata = {
  title: "About CyberVault — Security Research & Knowledge Base",
  description: "Learn about CyberVault's mission to publish verified security research, CVE triage, and offensive lab methodologies.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 font-sans">
      <div className="border-b border-[#1f3352] pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-[#9fef00] mb-2 font-bold">
          <Shield className="w-4 h-4" />
          <span>CYBERVAULT RESEARCH LAB</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
          ABOUT THE PLATFORM
        </h1>
      </div>

      <div className="article-prose space-y-6 text-sm text-slate-300 leading-relaxed">
        <p>
          <strong className="text-slate-100">CyberVault</strong> is an independent technical publication, vulnerability repository, and personal knowledge base created for cybersecurity engineers, red team operators, and blue team defenders.
        </p>

        <h2 className="text-lg font-bold text-slate-100 font-mono pt-4 text-[#9fef00]">Core Principles</h2>
        <ul className="space-y-2 list-disc pl-5">
          <li><strong className="text-slate-200">Empirical Verification:</strong> Every vulnerability analysis and lab walkthrough is verified in an isolated lab environment before publication.</li>
          <li><strong className="text-slate-200">Zero Hallucinated Metrics:</strong> We do not fabricate CVE scores, affected versions, or citations. Facts and hypotheses are rigorously separated.</li>
          <li><strong className="text-slate-200">Defensive Engineering:</strong> Offensive insights exist to inform hardening, SIEM detection rules, and proactive remediation.</li>
        </ul>

        <h2 className="text-lg font-bold text-slate-100 font-mono pt-4 text-[#9fef00]">Publication Scope</h2>
        <p>
          Our coverage spans original vulnerability research, CVSS vector deconstructions, Hack The Box and TryHackMe room walkthroughs, Active Directory privilege escalation guides, and quick-reference tactical cheat sheets.
        </p>
      </div>
    </div>
  );
}
