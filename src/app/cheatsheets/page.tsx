"use client";

import { useState, useMemo } from "react";
import {
  Terminal,
  Search,
  Copy,
  Check,
  Zap,
  Filter,
  ChevronRight,
  Sparkles,
  Cpu,
  FileCode,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { CHEATSHEETS, CheatsheetService } from "@/data/cheatsheets";

export default function CheatsheetsPage() {
  const [activeTab, setActiveTab] = useState<"cheatsheets" | "nmap-suggestor">("cheatsheets");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Nmap Suggestor State
  const [nmapInput, setNmapInput] = useState("");
  const [targetIp, setTargetIp] = useState("10.10.11.50");

  const categories = ["All", "Network Ports", "Active Directory", "Databases", "Linux", "Windows", "Web", "Cloud"];

  const handleCopy = (cmd: string, id: string) => {
    const finalCmd = cmd.replace(/<TARGET>/g, targetIp);
    navigator.clipboard.writeText(finalCmd);
    setCopiedIndex(id);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  const filteredServices = useMemo(() => {
    return CHEATSHEETS.filter((item) => {
      const matchCat =
        selectedCategory === "All" || item.category === selectedCategory;

      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.protocol.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        (item.port && item.port.toString().includes(q)) ||
        item.tags?.some((t) => t.toLowerCase().includes(q)) ||
        Object.values(item.phases).some((phaseCmds) =>
          phaseCmds?.some(
            (c) =>
              c.label.toLowerCase().includes(q) ||
              c.command.toLowerCase().includes(q) ||
              c.description.toLowerCase().includes(q)
          )
        );

      return matchCat && matchSearch;
    });
  }, [search, selectedCategory]);

  // Nmap Analyzer: Parse ports from pasted text
  const detectedServices = useMemo(() => {
    if (!nmapInput.trim()) return [];
    const portRegex = /(\d{1,5})\/(tcp|udp)\s+open\s+([\w\-\.]+)/gi;
    const foundPorts: { port: number; service: string }[] = [];
    let match;

    while ((match = portRegex.exec(nmapInput)) !== null) {
      foundPorts.push({
        port: parseInt(match[1], 10),
        service: match[3],
      });
    }

    // Match found ports with our Cheatsheet database
    const matched = CHEATSHEETS.filter((cs) => {
      if (!cs.port) return false;
      const csPortNum = typeof cs.port === "number" ? cs.port : parseInt(cs.port.toString(), 10);
      return foundPorts.some((fp) => fp.port === csPortNum);
    });

    return matched;
  }, [nmapInput]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="relative rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-6 sm:p-10 overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--htb-green)]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--surface-border)] bg-[var(--surface)] text-[var(--htb-green)] text-xs font-mono font-bold tracking-wider">
            <Zap className="w-3.5 h-3.5 text-[var(--htb-green)] animate-pulse" />
            <span>HACKINDEX COMMAND KNOWLEDGE BASE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground-bright)] font-mono tracking-tight flex items-center gap-2">
            <span className="text-[var(--htb-green)]">{">"}</span> PENTEST CHEATSHEETS & PORT MATRIX
          </h1>
          <p className="text-sm sm:text-base text-[var(--foreground)] leading-relaxed font-sans">
            Tactical security assessment reference modeled after HackIndex. Real-world copy-paste commands, reconnaissance pipelines, active directory attack paths, privilege escalation tricks, and an automated Nmap port suggestor.
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-md bg-[var(--surface)] border border-[var(--surface-border)] text-[var(--foreground)]">
              <strong className="text-[var(--htb-green)]">{CHEATSHEETS.length}</strong> Services & Ports
            </span>
            <span className="px-2.5 py-1 rounded-md bg-[var(--surface)] border border-[var(--surface-border)] text-[var(--foreground)]">
              <strong className="text-[var(--htb-green)]">75+</strong> Copy-Paste Commands
            </span>
            <span className="px-2.5 py-1 rounded-md bg-[var(--surface)] border border-[var(--surface-border)] text-[var(--foreground)]">
              <strong className="text-[var(--htb-green)]">4</strong> Attack Phases
            </span>
          </div>
        </div>
      </div>

      {/* Main View Tabs (Cheatsheet Matrix vs Nmap Suggestor) */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--surface-border)] pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("cheatsheets")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all border ${
              activeTab === "cheatsheets"
                ? "bg-[var(--htb-green)] text-white dark:text-[#0b121e] border-[var(--htb-green)] shadow-sm"
                : "bg-[var(--surface-card)] text-[var(--foreground)] border-[var(--surface-border)] hover:border-[var(--htb-green)]/60"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Cheatsheet Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab("nmap-suggestor")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all border ${
              activeTab === "nmap-suggestor"
                ? "bg-[var(--htb-green)] text-white dark:text-[#0b121e] border-[var(--htb-green)] shadow-sm"
                : "bg-[var(--surface-card)] text-[var(--foreground)] border-[var(--surface-border)] hover:border-[var(--htb-green)]/60"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Nmap Output Suggestor</span>
          </button>
        </div>

        {/* Global Target IP setter */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[var(--foreground-muted)] hidden sm:inline">Target IP:</span>
          <input
            type="text"
            value={targetIp}
            onChange={(e) => setTargetIp(e.target.value)}
            placeholder="10.10.11.50"
            className="w-36 px-2.5 py-1.5 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-card)] text-xs font-mono text-[var(--foreground-bright)] focus:outline-none focus:border-[var(--htb-green)]"
          />
        </div>
      </div>

      {/* TAB 1: Cheatsheet Matrix View */}
      {activeTab === "cheatsheets" && (
        <div className="space-y-6">
          {/* Search & Phase Filters */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by port (e.g. 445, 88), service, or command (e.g. kerberoast, suid)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] text-xs sm:text-sm font-mono text-[var(--foreground-bright)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--htb-green)] transition-all shadow-inner"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--foreground-muted)] hover:text-[var(--foreground-bright)]"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Phase Filter Selector */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)]">
                <Filter className="w-3.5 h-3.5 ml-2 text-[var(--foreground-muted)] hidden sm:inline" />
                {[
                  { id: "all", label: "All Phases" },
                  { id: "recon", label: "Recon" },
                  { id: "enumeration", label: "Enum" },
                  { id: "exploitation", label: "Exploit" },
                  { id: "privesc", label: "PrivEsc" },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPhase(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                      selectedPhase === p.id
                        ? "bg-[var(--htb-green)] text-white dark:text-[#0b121e] font-bold shadow-sm"
                        : "text-[var(--foreground)] hover:text-[var(--htb-green)]"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
                    selectedCategory === cat
                      ? "border-[var(--htb-green)] bg-[var(--surface-card)] text-[var(--htb-green)] shadow-[0_0_10px_var(--htb-green-glow)]"
                      : "border-[var(--surface-border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--htb-green)]/50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Cheatsheets List */}
          <div className="space-y-6">
            {filteredServices.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)]">
                <Terminal className="w-8 h-8 mx-auto text-[var(--foreground-muted)] mb-3" />
                <p className="text-sm font-mono text-[var(--foreground)]">
                  No matching cheatsheets found for "{search}".
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("All");
                    setSelectedPhase("all");
                  }}
                  className="mt-3 text-xs font-mono text-[var(--htb-green)] hover:underline"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-6 space-y-6 shadow-md transition-all hover:border-[var(--surface-border-hover)]"
                >
                  {/* Service Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--surface-border)]">
                    <div className="flex items-center gap-3">
                      {service.port && (
                        <div className="px-2.5 py-1 rounded-lg bg-[var(--surface-card)] border border-[var(--surface-border)] font-mono font-bold text-xs text-[var(--htb-green)]">
                          PORT {service.port}
                        </div>
                      )}
                      <div>
                        <h2 className="text-lg font-bold text-[var(--foreground-bright)] font-mono">
                          {service.title}
                        </h2>
                        <span className="text-xs font-mono text-[var(--foreground-muted)]">
                          {service.protocol} • {service.category}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--foreground)] max-w-md font-sans">
                      {service.summary}
                    </p>
                  </div>

                  {/* Commands Grid by Phase */}
                  <div className="space-y-5">
                    {(["recon", "enumeration", "exploitation", "privesc"] as const).map(
                      (phaseKey) => {
                        if (selectedPhase !== "all" && selectedPhase !== phaseKey) return null;
                        const cmds = service.phases[phaseKey];
                        if (!cmds || cmds.length === 0) return null;

                        const phaseTitle =
                          phaseKey === "recon"
                            ? "1. Reconnaissance & Fingerprinting"
                            : phaseKey === "enumeration"
                            ? "2. Service Enumeration & Info Gathering"
                            : phaseKey === "exploitation"
                            ? "3. Weaponized Exploitation & Foothold"
                            : "4. Privilege Escalation & Post-Exploit";

                        return (
                          <div key={phaseKey} className="space-y-2.5">
                            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--htb-green)] flex items-center gap-1.5">
                              <ChevronRight className="w-3.5 h-3.5" />
                              <span>{phaseTitle}</span>
                            </h3>

                            <div className="grid grid-cols-1 gap-2.5">
                              {cmds.map((cmd, idx) => {
                                const copyId = `${service.id}-${phaseKey}-${idx}`;
                                const isCopied = copiedIndex === copyId;
                                const renderedCmd = cmd.command.replace(/<TARGET>/g, targetIp);

                                return (
                                  <div
                                    key={idx}
                                    className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] p-3.5 space-y-2 hover:border-[var(--surface-border-hover)] transition-all group"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs font-mono font-bold text-[var(--foreground-bright)]">
                                        {cmd.label}
                                      </span>
                                      <button
                                        onClick={() => handleCopy(cmd.command, copyId)}
                                        title="Copy command with Target IP"
                                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 transition-all ${
                                          isCopied
                                            ? "bg-emerald-500 text-white font-bold"
                                            : "bg-[var(--surface)] border border-[var(--surface-border)] text-[var(--foreground)] hover:text-[var(--htb-green)] hover:border-[var(--htb-green)]"
                                        }`}
                                      >
                                        {isCopied ? (
                                          <>
                                            <Check className="w-3 h-3" />
                                            <span>Copied!</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3 h-3" />
                                            <span>Copy</span>
                                          </>
                                        )}
                                      </button>
                                    </div>

                                    <p className="text-[11px] text-[var(--foreground-muted)] font-sans">
                                      {cmd.description}
                                    </p>

                                    <div className="p-2.5 rounded-lg bg-[var(--code-bg)] border border-[var(--surface-border)] overflow-x-auto">
                                      <code className="text-xs font-mono text-[var(--code-text)] select-all whitespace-pre">
                                        {renderedCmd}
                                      </code>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Nmap Output Suggestor View */}
      {activeTab === "nmap-suggestor" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-6 space-y-4 shadow-md">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[var(--htb-green)]" />
              <h2 className="text-lg font-bold text-[var(--foreground-bright)] font-mono">
                Automated Nmap Port & Exploit Suggestor
              </h2>
            </div>
            <p className="text-xs text-[var(--foreground-muted)] font-sans">
              Paste your raw Nmap output below. The analyzer will extract open ports (e.g. 53, 88, 135, 389, 445, 1433, 2049, 3306, 5432, 6379) and automatically recommend targeted attack commands and enumeration techniques.
            </p>

            <textarea
              rows={6}
              value={nmapInput}
              onChange={(e) => setNmapInput(e.target.value)}
              placeholder={`Example:\nPORT     STATE SERVICE       VERSION\n22/tcp   open  ssh           OpenSSH 8.9p1\n88/tcp   open  kerberos-sec  Microsoft Windows Kerberos\n135/tcp  open  msrpc         Microsoft Windows RPC\n389/tcp  open  ldap          Microsoft Windows Active Directory LDAP\n445/tcp  open  microsoft-ds  Windows Server 2022\n1433/tcp open  ms-sql-s      Microsoft SQL Server 2019`}
              className="w-full p-3.5 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] text-xs font-mono text-[var(--foreground-bright)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--htb-green)]"
            />

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setNmapInput(
                    `PORT     STATE SERVICE       VERSION\n88/tcp   open  kerberos-sec  Microsoft Windows Kerberos\n135/tcp  open  msrpc         Microsoft Windows RPC\n389/tcp  open  ldap          Microsoft Windows Active Directory LDAP\n445/tcp  open  microsoft-ds  Windows Server 2022\n1433/tcp open  ms-sql-s      Microsoft SQL Server 2019\n5985/tcp open  wsman         Microsoft HTTPAPI`
                  );
                }}
                className="text-xs font-mono text-[var(--htb-green)] hover:underline"
              >
                Load Demo Active Directory Nmap Scan
              </button>
              {nmapInput && (
                <button
                  onClick={() => setNmapInput("")}
                  className="text-xs font-mono text-[var(--foreground-muted)] hover:text-[var(--foreground-bright)]"
                >
                  Clear Output
                </button>
              )}
            </div>
          </div>

          {/* Detected Services Output */}
          {nmapInput.trim() && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono font-bold text-[var(--foreground-bright)]">
                  Matched Attack Paths ({detectedServices.length} Services Detected)
                </h3>
              </div>

              {detectedServices.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)]">
                  <p className="text-xs font-mono text-[var(--foreground-muted)]">
                    No standard known ports detected in the pasted output. Ensure output contains lines like "445/tcp open smb".
                  </p>
                </div>
              ) : (
                detectedServices.map((service) => (
                  <div
                    key={service.id}
                    className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface)] p-6 space-y-4 shadow-md"
                  >
                    <div className="flex items-center justify-between border-b border-[var(--surface-border)] pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded bg-[var(--htb-green)] text-white dark:text-[#0b121e] font-mono font-bold text-xs">
                          PORT {service.port}
                        </span>
                        <h4 className="text-base font-bold text-[var(--foreground-bright)] font-mono">
                          {service.title}
                        </h4>
                      </div>
                      <span className="text-xs font-mono text-[var(--foreground-muted)]">
                        {service.category}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--foreground)]">{service.summary}</p>

                    {/* Top Recommended Exploitation Commands */}
                    <div className="space-y-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--htb-green)]">
                        Recommended Attack Sequence:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {[
                          ...service.phases.enumeration.slice(0, 2),
                          ...service.phases.exploitation.slice(0, 2),
                        ].map((cmd, cIdx) => {
                          const copyId = `nmap-${service.id}-${cIdx}`;
                          const isCopied = copiedIndex === copyId;
                          const renderedCmd = cmd.command.replace(/<TARGET>/g, targetIp);

                          return (
                            <div
                              key={cIdx}
                              className="p-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card)] space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono font-bold text-[var(--foreground-bright)]">
                                  {cmd.label}
                                </span>
                                <button
                                  onClick={() => handleCopy(cmd.command, copyId)}
                                  className="text-[10px] font-mono text-[var(--htb-green)] hover:underline"
                                >
                                  {isCopied ? "✓ Copied" : "Copy"}
                                </button>
                              </div>
                              <code className="block text-[11px] font-mono text-[var(--code-text)] bg-[var(--code-bg)] p-2 rounded truncate select-all">
                                {renderedCmd}
                              </code>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
