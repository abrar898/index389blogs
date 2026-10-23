"use client";

import { useState, useEffect } from "react";
import { Bookmark, Check, Share2 } from "lucide-react";

interface BookmarkButtonProps {
  slug: string;
  title: string;
}

interface SavedArticle {
  slug: string;
  title: string;
  savedAt: string;
}

export function BookmarkButton({ slug, title }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("cybervault_bookmarks");
      if (stored) {
        const list: SavedArticle[] = JSON.parse(stored);
        setIsBookmarked(list.some((item) => item.slug === slug));
      }
    } catch {
      // ignore JSON parse error
    }
  }, [slug]);

  const toggleBookmark = () => {
    try {
      const stored = localStorage.getItem("cybervault_bookmarks");
      let list: SavedArticle[] = stored ? JSON.parse(stored) : [];

      if (isBookmarked) {
        list = list.filter((item) => item.slug !== slug);
        setIsBookmarked(false);
      } else {
        list.push({ slug, title, savedAt: new Date().toISOString() });
        setIsBookmarked(true);
      }

      localStorage.setItem("cybervault_bookmarks", JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const shareArticle = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleBookmark}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-mono transition-all ${
          isBookmarked
            ? "bg-[#9fef00]/15 border-[#9fef00] text-[#9fef00] font-bold shadow-[0_0_12px_rgba(159,239,0,0.2)]"
            : "bg-[var(--surface)] border-[var(--surface-border)] text-[var(--foreground)] hover:border-[#9fef00]/60 hover:text-[#9fef00]"
        }`}
        title={isBookmarked ? "Remove Bookmark" : "Save for offline reading"}
      >
        <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-[#9fef00]" : ""}`} />
        <span>{isBookmarked ? "Saved" : "Save"}</span>
      </button>

      <button
        type="button"
        onClick={shareArticle}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--surface)] border border-[var(--surface-border)] text-xs text-[var(--foreground)] font-mono hover:border-[#9fef00]/60 hover:text-[#9fef00] transition-colors"
        title="Copy article link"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-[#9fef00]" />
            <span className="text-[#9fef00] font-bold">Copied!</span>
          </>
        ) : (
          <>
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </>
        )}
      </button>
    </div>
  );
}
