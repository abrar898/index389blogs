"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "white" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "dark" | "white";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "white">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("cybervault_theme") as Theme | null;
    if (stored === "dark" || stored === "white" || stored === "system") {
      setThemeState(stored);
    } else {
      setThemeState("system");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      let active: "dark" | "white" = "dark";
      if (theme === "system") {
        active = mediaQuery.matches ? "dark" : "white";
      } else {
        active = theme;
      }

      setResolvedTheme(active);
      const root = document.documentElement;

      if (active === "white") {
        root.classList.remove("dark");
        root.classList.add("white", "light");
      } else {
        root.classList.remove("white", "light");
        root.classList.add("dark");
      }
    };

    applyTheme();

    const listener = () => {
      if (theme === "system") {
        applyTheme();
      }
    };

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("cybervault_theme", newTheme);
  };

  const toggleTheme = () => {
    // If white, toggle to dark; if dark or system, switch to white directly on click
    if (resolvedTheme === "white") {
      setTheme("dark");
    } else {
      setTheme("white");
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
