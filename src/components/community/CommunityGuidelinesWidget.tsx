import Link from "next/link";
import { ShieldAlert, CheckCircle, Terminal, HelpCircle } from "lucide-react";

export function CommunityGuidelinesWidget() {
  const rules = [
    { title: "Authorized Targets Only", desc: "No live exploitation against unauthorized production targets." },
    { title: "Sanitize Sensitive Data", desc: "Redact IPs, credentials, client tokens, and real PII." },
    { title: "Responsible Disclosure", desc: "Adhere to the 90-day vulnerability disclosure policy." },
    { title: "Constructive Technical Discourse", desc: "Provide reproducible commands, citations, and verified evidence." },
  ];

  return (
    <div className="p-5 rounded-xl border border-[#1f3352] bg-[#111d30]/90 space-y-3.5 shadow-xl">
      <div className="flex items-center justify-between border-b border-[#1f3352] pb-3">
        <h3 className="text-xs font-mono font-bold tracking-wider text-slate-100 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#2de2e6]" />
          <span>RULES OF ENGAGEMENT</span>
        </h3>
        <Link
          href="/editorial-policy"
          className="text-[11px] font-mono text-[#2de2e6] hover:underline"
        >
          Policy
        </Link>
      </div>

      <div className="space-y-2.5">
        {rules.map((r, i) => (
          <div key={i} className="text-xs space-y-0.5">
            <div className="flex items-center gap-1.5 font-mono font-bold text-slate-200">
              <span className="text-[#9fef00] text-[10px]">{`[0${i + 1}]`}</span>
              <span>{r.title}</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans pl-6 leading-relaxed">
              {r.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-[#1f3352]/50 text-[10px] font-mono text-slate-500 flex items-center justify-between">
        <span>Moderated 24/7 by SecOps</span>
        <Link
          href="/responsible-disclosure"
          className="text-[#9fef00] hover:underline font-bold"
        >
          Disclosure FAQ &rarr;
        </Link>
      </div>
    </div>
  );
}
