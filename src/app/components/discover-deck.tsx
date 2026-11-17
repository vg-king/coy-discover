"use client";

import Image from "next/image";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { Heart, MapPin, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { PublicProfile } from "@/lib/services/types";

type SwipeResponse = {
  matched: boolean;
  match?: {
    id: string;
    createdAt: string;
    profile: PublicProfile;
  };
};

type DiscoverDeckProps = {
  onMatch: (match: SwipeResponse) => void;
};

type SwipeDirection = "LIKE" | "PASS";

function ProfileCard({
  profile,
  isTop,
  exitDirection,
  onSwipe,
}: {
  profile: PublicProfile;
  isTop: boolean;
  exitDirection: SwipeDirection;
  onSwipe: (direction: SwipeDirection) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-11, 0, 11]);
  const likeOpacity = useTransform(x, [0, 110], [0, 1]);
  const nopeOpacity = useTransform(x, [-110, 0], [1, 0]);

  function handleDragEnd(
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } },
  ) {
    if (Math.abs(info.offset.x) > 110 || Math.abs(info.velocity.x) > 500) {
      onSwipe(info.offset.x > 0 ? "LIKE" : "PASS");
    }
  }

  return (
    <motion.article
      className="absolute inset-0 overflow-hidden rounded-card border-[2.5px] border-coy-ink bg-coy-lavender"
      style={isTop ? { x, rotate } : undefined}
      initial={isTop ? { opacity: 0, y: 8, scale: 0.98 } : undefined}
      animate={isTop ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 12, scale: 0.96 }}
      exit={{
        opacity: 0,
        x: exitDirection === "LIKE" ? 520 : -520,
        rotate: exitDirection === "LIKE" ? 14 : -14,
      }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      dragMomentum={false}
      onDragEnd={isTop ? handleDragEnd : undefined}
      aria-label={`${profile.name}, ${profile.age}`}
    >
      <Image
        src={profile.photoUrl}
        alt={`${profile.name}'s profile`}
        fill
        priority={isTop}
        sizes="(max-width: 430px) 100vw, 430px"
        className="object-cover"
      />
      {isTop && (
        <>
          <motion.div
            className="absolute left-5 top-6 z-10 rounded-lg border-[2.5px] border-coy-ink bg-coy-mint px-3 py-1 font-heading text-2xl font-extrabold tracking-tight"
            style={{ opacity: likeOpacity, rotate: -12 }}
          >
            LIKE
          </motion.div>
          <motion.div
            className="absolute right-5 top-6 z-10 rounded-lg border-[2.5px] border-coy-ink bg-coy-pink px-3 py-1 font-heading text-2xl font-extrabold tracking-tight"
            style={{ opacity: nopeOpacity, rotate: 12 }}
          >
            NOPE
          </motion.div>
        </>
      )}
      <div className="absolute inset-x-0 bottom-0 z-10 h-3/5 bg-gradient-to-t from-coy-ink/90 via-coy-ink/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-20 p-5 text-white">
        <h2 className="font-heading text-3xl font-extrabold leading-none tracking-[-0.04em]">
          {profile.name}, {profile.age}
        </h2>
        <p className="mt-2 flex items-center gap-1 text-sm font-bold">
          <MapPin size={16} strokeWidth={2.5} />
          {profile.city}
        </p>
        <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/90">
          {profile.bio}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profile.interests.map((interest) => (
            <span
              key={interest}
              className="rounded-pill border-2 border-coy-ink bg-white px-2.5 py-1 text-xs font-bold text-coy-ink"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

function LoadingCard() {
  return (
    <div className="aspect-[3/4] w-full animate-pulse rounded-card border-[2.5px] border-coy-ink bg-coy-lavender p-5">
      <div className="h-full rounded-[18px] bg-white/70" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="ink-surface flex aspect-[3/4] w-full flex-col items-center justify-center rounded-card bg-coy-mint px-8 text-center">
      <div className="mb-5 flex h-24 w-24 rotate-[-6deg] items-center justify-center rounded-[28px] border-[2.5px] border-coy-ink bg-coy-pink text-5xl shadow-ink">
        ✨
      </div>
      <h2 className="font-heading text-3xl font-extrabold tracking-[-0.04em]">
        You&apos;re all caught up
      </h2>
      <p className="mt-3 max-w-xs text-sm leading-5 text-coy-muted">
        Nice work! Check Matches to see if any of your hellos turned into a
        connection.
      </p>
    </div>
  );
}

export function DiscoverDeck({ onMatch }: DiscoverDeckProps) {
  const [activeTab, setActiveTab] = useState<"swipe" | "matches">("swipe");
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exitDirection, setExitDirection] = useState<SwipeDirection>("LIKE");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/feed")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load your discover feed.");
        return (await response.json()) as PublicProfile[];
      })
      .then((feed) => {
        if (!cancelled) setProfiles(feed);
      })
      .catch(() => {
        if (!cancelled) setToast("We couldn’t load the deck. Try again.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3600);
  }, []);

  const handleSwipe = useCallback(
    async (direction: SwipeDirection) => {
      if (isSubmitting || !profiles[0]) return;

      const profile = profiles[0];
      setExitDirection(direction);
      setProfiles((current) => current.slice(1));
      setIsSubmitting(true);

      try {
        const response = await fetch("/api/swipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetId: profile.id, direction }),
        });

        if (!response.ok) throw new Error("Swipe failed.");

        onMatch((await response.json()) as SwipeResponse);
      } catch {
        setProfiles((current) =>
          current.some((item) => item.id === profile.id)
            ? current
            : [profile, ...current],
        );
        showToast("That didn’t stick. Your card is back.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, onMatch, profiles, showToast],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        void handleSwipe("PASS");
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        void handleSwipe("LIKE");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSwipe]);

  const visibleProfiles = profiles.slice(0, 2);

  return (
    <main className="flex flex-1 flex-col px-5 pb-5">
      <div className="ink-surface mb-6 grid grid-cols-2 rounded-pill bg-white p-1">
        {(["swipe", "matches"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`rounded-pill px-4 py-2 text-sm font-bold capitalize transition-colors ${
              activeTab === tab ? "bg-coy-pink text-coy-ink" : "text-coy-muted"
            }`}
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "matches" ? (
        <section className="ink-surface flex flex-1 flex-col items-center justify-center rounded-card bg-coy-lavender px-8 text-center">
          <div className="text-6xl">💌</div>
          <h1 className="mt-5 font-heading text-3xl font-extrabold tracking-[-0.04em]">
            Matches are brewing
          </h1>
          <p className="mt-3 text-sm leading-5 text-coy-muted">
            Your mutual connections will land here soon.
          </p>
        </section>
      ) : (
        <>
          <section className="relative aspect-[3/4] w-full" aria-live="polite">
            {isLoading ? (
              <LoadingCard />
            ) : visibleProfiles.length === 0 ? (
              <EmptyState />
            ) : (
              <AnimatePresence initial={false} mode="popLayout">
                {visibleProfiles
                  .slice()
                  .reverse()
                  .map((profile, index) => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      isTop={index === visibleProfiles.length - 1}
                      exitDirection={exitDirection}
                      onSwipe={handleSwipe}
                    />
                  ))}
              </AnimatePresence>
            )}
          </section>

          <div className="mt-7 flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={() => void handleSwipe("PASS")}
              disabled={isLoading || isSubmitting || profiles.length === 0}
              className="ink-surface ink-press flex h-16 w-16 items-center justify-center rounded-full bg-white text-coy-pink disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Pass on this profile"
            >
              <X size={30} strokeWidth={3} />
            </button>
            <button
              type="button"
              onClick={() => void handleSwipe("LIKE")}
              disabled={isLoading || isSubmitting || profiles.length === 0}
              className="ink-surface ink-press flex h-20 w-20 items-center justify-center rounded-full bg-coy-pink text-coy-ink disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Like this profile"
            >
              <Heart size={32} strokeWidth={2.7} fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={() => setProfiles((current) => [...current])}
              className="ink-surface ink-press flex h-12 w-12 items-center justify-center rounded-full bg-coy-mint text-coy-ink"
              aria-label="Refresh deck"
            >
              <RotateCcw size={20} strokeWidth={2.5} />
            </button>
          </div>
          <p className="mt-4 text-center text-xs font-bold text-coy-muted">
            Use ← → or drag a card to say hey
          </p>
        </>
      )}

      <div className="sr-only" aria-hidden="true">
        {profiles.slice(1, 3).map((profile) => (
          <Image
            key={profile.id}
            src={profile.photoUrl}
            alt=""
            width={1}
            height={1}
          />
        ))}
      </div>

      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-pill border-[2.5px] border-coy-ink bg-coy-ink px-4 py-2 text-sm font-bold text-white shadow-ink"
        >
          {toast}
        </div>
      )}
    </main>
  );
}
