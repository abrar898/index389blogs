import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CopyCodeListener } from "@/components/articles/CopyCodeButton";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "Index 389 — Cybersecurity Research, Threat Intelligence & Knowledge Base",
    template: "%s | Index 389",
  },
  description:
    "An independent cybersecurity research publication, vulnerability laboratory, and technical knowledge base for offensive verification and defensive engineering.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  keywords: [
    "Cybersecurity",
    "Vulnerability Research",
    "CVE Analysis",
    "Hack The Box",
    "Penetration Testing",
    "Active Directory",
    "Linux Security",
  ],
  authors: [{ name: "Index 389 Research Team" }],
  openGraph: {
    title: "Index 389 — Cybersecurity Research & Technical Knowledge Base",
    description: "In-depth CVE analysis, lab walkthroughs, exploit research, and security engineering.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('cybervault_theme');
                  var supportDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'white' || (!theme && !supportDark)) {
                    document.documentElement.classList.add('white');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#0b121e] text-[#a4b1cd] antialiased selection:bg-[#9fef00]/25 selection:text-[#9fef00]">
        <ThemeProvider>
          <CopyCodeListener />
          <Suspense fallback={<div className="h-16 border-b border-[#1f3352] bg-[#0b121e]" />}>
            <Header />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
