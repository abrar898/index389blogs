"use client";

import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] opacity-50" />
    );
  }

  const isWhite = resolvedTheme === "white";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isWhite ? "Switch to Dark theme" : "Switch to White theme"}
      aria-label="Toggle white theme"
      className="relative flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] text-[var(--foreground)] hover:text-[#9fef00] hover:border-[#9fef00]/60 transition-all shadow-sm"
    >
      {isWhite ? (
        <Moon className="w-4 h-4 text-amber-600 transition-transform hover:scale-110" />
      ) : (
        <Sun className="w-4 h-4 text-[#9fef00] transition-transform hover:scale-110" />
      )}
    </button>
  );
}
