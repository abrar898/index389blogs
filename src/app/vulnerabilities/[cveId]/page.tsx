import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { parseMarkdown } from "@/lib/markdown/renderer";
import {
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  ArrowLeft,
  ExternalLink,
  Code,
  Terminal,
  FileText,
  Clock,
  User,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cveId: string }>;
}) {
  const { cveId } = await params;
  const cve = await db.cVERecord.findUnique({
    where: { cveId },
    select: { cveId: true, title: true, summary: true },
  });

  if (!cve) return { title: "Vulnerability Not Found | CyberVault" };

  return {
    title: `${cve.cveId}: ${cve.title}`,
    description: cve.summary,
  };
}

export default async function CVEDetailPage({
  params,
}: {
  params: Promise<{ cveId: string }>;
}) {
  const { cveId } = await params;

  const cve = await db.cVERecord.findUnique({
    where: { cveId },
    include: {
      author: true,
      references: true,
    },
  });

  if (!cve) {
    notFound();
  }

  const analysisHtml = cve.analysisContent
    ? parseMarkdown(cve.analysisContent).html
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <Link
        href="/vulnerabilities"
        className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-[#9fef00] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Vulnerability Tracker
      </Link>

      {/* Hero Header */}
      <header className="p-6 rounded-2xl border border-[#1f3352] bg-[#111d30]/90 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono font-extrabold text-[#9fef00]">
              {cve.cveId}
            </span>
            <span
              className={`px-3 py-1 rounded text-xs font-mono font-bold ${
                cve.severity === "CRITICAL"
                  ? "bg-[#ff3366]/15 border border-[#ff3366]/40 text-[#ff3366]"
                  : "bg-[#ff8400]/15 border border-[#ff8400]/40 text-[#ff8400]"
              }`}
            >
              CVSS {cve.cvssScore.toFixed(1)} {cve.severity}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {cve.knownExploited && (
              <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-[#ff3366]/20 border border-[#ff3366]/50 text-[#ff3366]">
                ACTIVE IN THE WILD
              </span>
            )}
            {cve.patchAvailable ? (
              <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-[#9fef00]/15 border border-[#9fef00]/40 text-[#9fef00] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> PATCH AVAILABLE
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-[#ff8400]/15 border border-[#ff8400]/40 text-[#ff8400] flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5" /> ZERO-DAY / UNPATCHED
              </span>
            )}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 leading-tight">
          {cve.title}
        </h1>

        <p className="text-sm text-slate-400 leading-relaxed font-sans">{cve.summary}</p>

        <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-[#1f3352] text-xs font-mono text-slate-400">
          <span>Published: {new Date(cve.publishedAt).toLocaleDateString()}</span>
          <span>Analyst: {cve.author.name}</span>
          {cve.cvssVector && (
            <span className="text-[#2de2e6]/90">Vector: {cve.cvssVector}</span>
          )}
        </div>
      </header>

      {/* Affected Software Matrix */}
      <section className="p-6 rounded-xl border border-[#1f3352] bg-[#111d30]/60 space-y-4">
        <h2 className="text-sm font-mono font-bold uppercase text-slate-200 tracking-wider">
          Affected Software & Scope
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 rounded-lg bg-[#0b121e] border border-[#1f3352]">
            <span className="text-slate-500 block mb-1">AFFECTED PRODUCT</span>
            <span className="text-slate-200 font-bold">{cve.affectedProducts}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#0b121e] border border-[#1f3352]">
            <span className="text-slate-500 block mb-1">VULNERABLE VERSIONS</span>
            <span className="text-[#ff3366]">{cve.affectedVersions}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#0b121e] border border-[#1f3352]">
            <span className="text-slate-500 block mb-1">FIXED IN VERSION</span>
            <span className="text-[#9fef00]">{cve.fixedVersions || "None announced"}</span>
          </div>
        </div>
      </section>

      {/* Technical Description */}
      <section className="p-6 rounded-xl border border-[#1f3352] bg-[#111d30]/60 space-y-3">
        <h2 className="text-sm font-mono font-bold uppercase text-slate-200 tracking-wider">
          Technical Root Cause
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
          {cve.technicalDescription}
        </p>
      </section>

      {/* Detection & SIEM Rules */}
      {cve.detectionRules && (
        <section className="p-6 rounded-xl border border-[#1f3352] bg-[#111d30]/60 space-y-3">
          <h2 className="text-sm font-mono font-bold uppercase text-slate-200 tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#9fef00]" />
            Detection Logic (Snort / Suricata / Sigma)
          </h2>
          <div className="p-4 rounded-lg bg-[#070b12] border border-[#1f3352] font-mono text-xs text-[#9fef00] overflow-x-auto">
            <code>{cve.detectionRules}</code>
          </div>
        </section>
      )}

      {/* Mitigation */}
      {cve.mitigation && (
        <section className="p-6 rounded-xl border border-[#9fef00]/30 bg-[#9fef00]/5 space-y-3">
          <h2 className="text-sm font-mono font-bold uppercase text-[#9fef00] tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Remediation & Mitigation Guidance
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">{cve.mitigation}</p>
        </section>
      )}

      {/* Deep Dive Analysis Content */}
      {analysisHtml && (
        <section className="p-6 rounded-xl border border-[#1f3352] bg-[#111d30]/60 space-y-4">
          <h2 className="text-sm font-mono font-bold uppercase text-slate-200 tracking-wider">
            Detailed Research Analysis
          </h2>
          <div
            className="article-prose text-xs"
            dangerouslySetInnerHTML={{ __html: analysisHtml }}
          />
        </section>
      )}

      {/* Authoritative References */}
      <section className="p-6 rounded-xl border border-[#1f3352] bg-[#111d30]/60 space-y-3">
        <h2 className="text-sm font-mono font-bold uppercase text-slate-200 tracking-wider">
          Authoritative References
        </h2>
        <ul className="space-y-2 text-xs font-mono">
          {cve.nvdUrl && (
            <li>
              <a
                href={cve.nvdUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9fef00] hover:underline flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> NIST NVD Advisory
              </a>
            </li>
          )}
          {cve.vendorAdvisoryUrl && (
            <li>
              <a
                href={cve.vendorAdvisoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9fef00] hover:underline flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Official Vendor Security Bulletin
              </a>
            </li>
          )}
          {cve.references.map((ref) => (
            <li key={ref.id}>
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9fef00] hover:underline flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> {ref.title}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
