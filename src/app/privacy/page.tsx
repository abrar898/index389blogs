export const metadata = {
  title: "Privacy Policy — CyberVault",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 font-sans">
      <h1 className="text-3xl font-extrabold text-zinc-100 font-mono tracking-tight pb-4 border-b border-zinc-800">
        PRIVACY POLICY
      </h1>
      <div className="article-prose space-y-4 text-sm text-zinc-300 leading-relaxed">
        <p>
          CyberVault is dedicated to absolute confidentiality. We do not sell operator data, run third-party tracking beacons, or inject advertising analytics scripts.
        </p>
        <h2 className="text-base font-bold font-mono text-zinc-100">Session Cookies</h2>
        <p>
          We use secure, HttpOnly, SameSite cookies solely for operator session authentication. No persistent cross-site tracking occurs.
        </p>
        <h2 className="text-base font-bold font-mono text-zinc-100">Private Notes & Drafts</h2>
        <p>
          Notes designated as <code>PRIVATE</code> are strictly isolated in the database layer and are never indexed, shared, or displayed in search results to other users.
        </p>
      </div>
    </div>
  );
}
