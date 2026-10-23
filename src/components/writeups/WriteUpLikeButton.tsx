"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import Link from "next/link";

interface WriteUpLikeButtonProps {
  writeupId: string;
  initialCount: number;
  initialHasLiked: boolean;
  isLoggedIn: boolean;
}

export function WriteUpLikeButton({
  writeupId,
  initialCount,
  initialHasLiked,
  isLoggedIn,
}: WriteUpLikeButtonProps) {
  const [likesCount, setLikesCount] = useState(initialCount);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [isPending, startTransition] = useTransition();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleToggleLike = async () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      setTimeout(() => setShowLoginPrompt(false), 3500);
      return;
    }

    // Optimistic UI update
    const previousHasLiked = hasLiked;
    const previousCount = likesCount;

    setHasLiked(!hasLiked);
    setLikesCount(hasLiked ? Math.max(0, likesCount - 1) : likesCount + 1);

    startTransition(async () => {
      try {
        const res = await fetch("/api/writeups/like", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ writeupId }),
        });

        if (!res.ok) {
          throw new Error("Failed to like write-up");
        }

        const data = await res.json();
        setLikesCount(data.count);
        setHasLiked(data.hasLiked);
      } catch (err) {
        console.error("Like action failed:", err);
        // Rollback
        setHasLiked(previousHasLiked);
        setLikesCount(previousCount);
      }
    });
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleToggleLike}
        disabled={isPending}
        title={
          !isLoggedIn
            ? "Sign in to like this write-up"
            : hasLiked
            ? "Unlike write-up"
            : "Like this write-up"
        }
        aria-label="Like this write-up"
        className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-mono transition-all ${
          hasLiked
            ? "bg-rose-500/15 border-rose-500/60 text-rose-400 font-bold shadow-[0_0_12px_rgba(244,63,94,0.25)]"
            : "bg-[var(--surface)] border-[var(--surface-border)] text-[var(--foreground)] hover:border-rose-500/50 hover:text-rose-400"
        } ${isPending ? "opacity-75 cursor-wait" : ""}`}
      >
        <Heart
          className={`w-3.5 h-3.5 transition-transform group-hover:scale-125 ${
            hasLiked ? "fill-rose-500 text-rose-500" : "text-[var(--foreground-muted)] group-hover:text-rose-400"
          }`}
        />
        <span>{likesCount}</span>
        <span className="hidden sm:inline">{likesCount === 1 ? "Like" : "Likes"}</span>
      </button>

      {/* Auth tooltip prompt when not logged in */}
      {showLoginPrompt && (
        <div className="absolute right-0 top-full mt-2 w-48 p-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--surface-dropdown)] shadow-xl z-20 text-[11px] font-mono animate-in fade-in zoom-in-95">
          <p className="text-[var(--foreground)] mb-1.5">Sign in to endorse this walkthrough.</p>
          <Link
            href="/login"
            className="inline-block px-2.5 py-1 rounded bg-[#9fef00] text-[#0b121e] font-bold hover:bg-[#b4fa1f] transition-colors"
          >
            Sign In &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
