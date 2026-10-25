import Link from "next/link";
import { db } from "@/lib/db";
import { ShieldAlert, Search, Filter, ShieldCheck, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Vulnerability Database & CVE Intelligence",
  description: "Track critical CVEs, CVSS scores, vendor advisories, detection rules, and exploitability analysis.",
};

export default async function VulnerabilitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; severity?: string }>;
}) {
  const { q, severity } = await searchParams;

  const whereClause: any = { isPublished: true };

  if (q) {
    whereClause.OR = [
      { cveId: { contains: q } },
      { title: { contains: q } },
      { affectedProducts: { contains: q } },
    ];
  }

  if (severity) {
    whereClause.severity = severity.toUpperCase();
  }

  const cves = await db.cVERecord.findMany({
    where: whereClause,
    include: { author: true },
    orderBy: { cvssScore: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-[#E2E4EB] dark:border-[#1f3352] pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-[#FF4D4D] dark:text-[#9fef00] mb-2 font-bold">
          <ShieldAlert className="w-4 h-4 text-[#FF4D4D]" />
          <span>NATIONAL VULNERABILITY DATABASE & RESEARCH REPOSITORY</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#0D0D1A] dark:text-slate-100 font-mono tracking-tight flex items-center gap-2">
          <span className="text-[#3AAA00] dark:text-[#9fef00]">{">"}</span> CVE & VULNERABILITY INTELLIGENCE
        </h1>
        <p className="text-sm text-[#4A4A6A] dark:text-slate-300 mt-2 max-w-2xl font-sans">
          Verified security advisories, CVSS vectors, exploitation likelihood (CISA KEV status), and mitigation engineering.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-xl border border-[#E2E4EB] dark:border-[#1f3352] bg-[#FFFFFF] dark:bg-[#111d30] shadow-sm">
        <form method="GET" className="flex items-center gap-2 w-full sm:w-96">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#3AAA00] dark:text-[#9fef00]" />
            <input
              type="text"
              name="q"
              defaultValue={q || ""}
              placeholder="Filter by CVE ID, software, or keyword..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#E8EAF0] dark:bg-[#0b121e] border border-[#E2E4EB] dark:border-[#1f3352] text-xs font-mono text-[#0D0D1A] dark:text-slate-200 placeholder:text-[#9A9AB0] focus:outline-none focus:border-[#9FEF00]"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-lg bg-[#1A1A2E] text-[#9FEF00] hover:bg-[#25253E] dark:bg-[#14233c] dark:hover:bg-[#1f3352] border border-[#1A1A2E] dark:border-[#1f3352] text-xs font-mono font-bold"
          >
            Search
          </button>
        </form>

        {/* Severity filters */}
        <div className="flex items-center gap-1.5 text-xs font-mono w-full sm:w-auto overflow-x-auto">
          <span className="text-[#4A4A6A] dark:text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#3AAA00] dark:text-[#9fef00]" /> Severity:
          </span>
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => {
            const isSelected = (!severity && sev === "ALL") || severity?.toUpperCase() === sev;
            return (
              <Link
                key={sev}
                href={sev === "ALL" ? "/vulnerabilities" : `/vulnerabilities?severity=${sev.toLowerCase()}`}
                className={`px-2.5 py-1 rounded text-[11px] uppercase transition-colors font-bold ${
                  isSelected
                    ? "bg-[#1A1A2E] text-[#9FEF00] dark:bg-[#9fef00] dark:text-[#0b121e]"
                    : "bg-[#E8EAF0] text-[#4A4A6A] hover:text-[#0D0D1A] dark:bg-[#14233c] dark:text-slate-300 hover:border-[#9FEF00] border border-[#E2E4EB] dark:border-[#1f3352]"
                }`}
              >
                {sev}
              </Link>
            );
          })}
        </div>
      </div>

      {/* CVE Table / Cards */}
      <div className="space-y-4">
        {cves.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-[#E2E4EB] dark:border-[#1f3352] bg-[#FFFFFF] dark:bg-[#111d30] shadow-sm">
            <p className="text-[#4A4A6A] dark:text-slate-400 text-sm font-mono">No vulnerability records match your criteria.</p>
          </div>
        ) : (
          cves.map((cve) => (
            <div
              key={cve.id}
              className="p-6 rounded-xl border border-[#E2E4EB] dark:border-[#1f3352] bg-[#FFFFFF] dark:bg-[#111d30] hover:bg-[#F0F2F5] dark:hover:bg-[#14233c] hover:border-[#FF4D4D]/60 hover:shadow-md transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/vulnerabilities/${cve.cveId}`}
                    className="text-lg font-mono font-bold text-[#00B4D8] dark:text-[#9fef00] hover:underline transition-colors"
                  >
                    {cve.cveId}
                  </Link>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                      cve.severity === "CRITICAL"
                        ? "bg-[#FFF0F0] border border-[#FF4D4D]/40 text-[#FF4D4D] dark:bg-red-950 dark:border-[#ff3366]/50 dark:text-[#ff3366]"
                        : cve.severity === "HIGH"
                        ? "bg-amber-50 border border-amber-300 text-amber-700 dark:bg-amber-950 dark:border-[#ff8400]/50 dark:text-[#ff8400]"
                        : "bg-[#E8FFF0] border border-[#9FEF00]/50 text-[#0D0D1A] dark:bg-[#14233c] dark:border-[#9fef00]/40 dark:text-[#9fef00]"
                    }`}
                  >
                    CVSS {cve.cvssScore.toFixed(1)} {cve.severity}
                  </span>
                  {cve.knownExploited && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/60 dark:text-red-200 dark:border-red-700 font-bold animate-pulse">
                      CISA KEV EXPLOITED
                    </span>
                  )}
                  {cve.patchAvailable && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#E8FFF0] dark:bg-[#14233c] text-[#0D0D1A] dark:text-[#9fef00] border border-[#9FEF00]/50 dark:border-[#9fef00]/40 flex items-center gap-1 font-bold">
                      <ShieldCheck className="w-3 h-3 text-[#3AAA00] dark:text-[#9fef00]" /> PATCH VERIFIED
                    </span>
                  )}
                </div>

                <span className="text-xs font-mono text-[#4A4A6A] dark:text-slate-400">
                  Published: {new Date(cve.publishedAt).toLocaleDateString()}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#0D0D1A] dark:text-slate-100 hover:text-[#FF4D4D] dark:hover:text-[#9fef00] transition-colors font-mono">
                  <Link href={`/vulnerabilities/${cve.cveId}`}>{cve.title}</Link>
                </h3>
                <p className="text-xs text-[#4A4A6A] dark:text-slate-300 mt-1 leading-relaxed font-sans">{cve.summary}</p>
              </div>

              {/* Product and CWE Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-[#E2E4EB] dark:border-[#1f3352] text-xs font-mono text-[#4A4A6A] dark:text-slate-400">
                <div>
                  <span className="text-[#9A9AB0] dark:text-slate-500 block text-[10px] uppercase">Affected Software</span>
                  <span className="text-[#0D0D1A] dark:text-slate-200">{cve.affectedProducts}</span>
                </div>
                <div>
                  <span className="text-[#9A9AB0] dark:text-slate-500 block text-[10px] uppercase">Vulnerable Versions</span>
                  <span className="text-[#FFA500] font-bold">{cve.affectedVersions}</span>
                </div>
                <div>
                  <span className="text-[#9A9AB0] dark:text-slate-500 block text-[10px] uppercase">CWE Classification</span>
                  <span className="text-[#0D0D1A] dark:text-slate-200 truncate block">{cve.cweId || "N/A"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs font-mono">
                <span className="text-[#9A9AB0] dark:text-slate-400 text-[11px]">
                  Vector: {cve.cvssVector || "Unspecified"}
                </span>
                <Link
                  href={`/vulnerabilities/${cve.cveId}`}
                  className="text-[#FF4D4D] dark:text-[#9fef00] hover:underline font-bold flex items-center gap-1"
                >
                  Full Technical Analysis &rarr;
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
