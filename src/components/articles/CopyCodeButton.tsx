"use client";

import { useEffect } from "react";

export function CopyCodeListener() {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest(".copy-code-btn");
      if (!target) return;

      const encoded = target.getAttribute("data-code");
      if (!encoded) return;

      const code = decodeURIComponent(encoded);
      navigator.clipboard.writeText(code).then(() => {
        const originalText = target.innerHTML;
        target.innerHTML = `<span class="text-emerald-400">Copied!</span>`;
        setTimeout(() => {
          target.innerHTML = originalText;
        }, 2000);
      });
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
