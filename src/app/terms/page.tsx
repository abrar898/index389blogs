export const metadata = {
  title: "Terms of Service — CyberVault",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 font-sans">
      <h1 className="text-3xl font-extrabold text-zinc-100 font-mono tracking-tight pb-4 border-b border-zinc-800">
        TERMS OF SERVICE
      </h1>
      <div className="article-prose space-y-4 text-sm text-zinc-300 leading-relaxed">
        <p>
          By accessing CyberVault research, code snippets, cheat sheets, or community modules, you agree to comply with all applicable local, national, and international cybersecurity laws.
        </p>
        <h2 className="text-base font-bold font-mono text-zinc-100">Educational & Verification Use Only</h2>
        <p>
          All information, commands, tools, and methodologies documented across this platform are provided strictly for educational purposes, defensive telemetry configuration, and testing against systems for which you have explicit, written authorization.
        </p>
        <h2 className="text-base font-bold font-mono text-zinc-100">Disclaimer of Liability</h2>
        <p>
          CyberVault and its contributors assume zero liability and bear no responsibility for any misuse or damage caused by the application of techniques, exploits, or commands discussed on this platform.
        </p>
      </div>
    </div>
  );
}
