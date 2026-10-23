"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Trash2, ArrowRight } from "lucide-react";

interface SavedArticle {
  slug: string;
  title: string;
  savedAt: string;
}

export function SavedArticlesSection() {
  const [bookmarks, setBookmarks] = useState<SavedArticle[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("cybervault_bookmarks");
      if (stored) {
        setBookmarks(JSON.parse(stored));
      }
    } catch {
      // ignore JSON parse error
    }
  }, []);

  const removeBookmark = (slug: string) => {
    const updated = bookmarks.filter((b) => b.slug !== slug);
    setBookmarks(updated);
    localStorage.setItem("cybervault_bookmarks", JSON.stringify(updated));
  };

  if (!mounted || bookmarks.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 p-5 rounded-xl border border-[#9fef00]/30 bg-[#111d30] shadow-[0_0_20px_rgba(159,239,0,0.06)]">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1f3352]">
        <h3 className="text-sm font-mono font-bold text-[#9fef00] flex items-center gap-2">
          <Bookmark className="w-4 h-4 fill-[#9fef00]" />
          SAVED FOR LATER ({bookmarks.length})
        </h3>
        <span className="text-[11px] font-mono text-slate-400">Stored on your device</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {bookmarks.map((b) => (
          <div
            key={b.slug}
            className="p-3 rounded-lg border border-[#1f3352] bg-[#14233c] flex flex-col justify-between group hover:border-[#9fef00]/50 transition-all"
          >
            <Link
              href={`/articles/${b.slug}`}
              className="text-xs font-mono font-bold text-slate-100 group-hover:text-[#9fef00] line-clamp-2 transition-colors mb-2"
            >
              {b.title}
            </Link>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-[#1f3352]/60">
              <Link
                href={`/articles/${b.slug}`}
                className="text-[#9fef00] hover:underline flex items-center gap-1 font-semibold"
              >
                Read <ArrowRight className="w-3 h-3" />
              </Link>
              <button
                type="button"
                onClick={() => removeBookmark(b.slug)}
                className="text-slate-400 hover:text-[#ff3366] transition-colors p-1"
                title="Remove from saved"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
