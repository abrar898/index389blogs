import { ShieldAlert, CheckCircle, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Editorial Policy — CyberVault",
  description: "CyberVault's editorial standards, verification requirements, and technical review guidelines.",
};

export default function EditorialPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 font-sans">
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-extrabold text-zinc-100 font-mono tracking-tight">
          EDITORIAL POLICY & ACCURACY STANDARDS
        </h1>
        <p className="text-xs text-zinc-400 font-mono mt-1">
          Standards governing technical authoring, CVE reporting, and peer review.
        </p>
      </div>

      <div className="article-prose space-y-6 text-sm text-zinc-300 leading-relaxed">
        <h2 className="text-base font-bold font-mono text-zinc-100">1. Verification Standard</h2>
        <p>
          Authors must reproduce claimed vulnerabilities or lab attack paths in isolated laboratory conditions. Incomplete assertions or unconfirmed rumors must be labeled explicitly as unverified.
        </p>

        <h2 className="text-base font-bold font-mono text-zinc-100">2. Authoritative Data Sourcing</h2>
        <p>
          CVE scores, affected software versions, and CWE classifications must link to authoritative sources including NIST NVD, MITRE CVE Program, CISA KEV catalogs, or confirmed vendor security advisories.
        </p>

        <h2 className="text-base font-bold font-mono text-zinc-100">3. Non-Weaponized Proofs of Concept</h2>
        <p>
          Sample code published on CyberVault is intended for detection development, defensive telemetry verification, and authorized lab practice. Complete automated weaponized exploit chains are prohibited.
        </p>
      </div>
    </div>
  );
}
