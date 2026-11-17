"use client";

/* eslint-disable @next/next/no-img-element */

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Heart, MapPin, X } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { avatarUrl } from "@/lib/avatar";
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

type MatchItem = {
  createdAt: string;
  profile: PublicProfile;
};

export type SwipeDirection = "right" | "left";

export type SwipeCardHandle = {
  swipe: (direction: SwipeDirection) => Promise<void>;
};

type ProfileCardProps = {
  profile: PublicProfile;
  isTop: boolean;
  onSwiped: (profileId: string, direction: SwipeDirection) => void;
};

const ProfileCard = forwardRef<SwipeCardHandle, ProfileCardProps>(
  function ProfileCard({ profile, isTop, onSwiped }, ref) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-220, 0, 220], [-11, 0, 11]);
    const likeOpacity = useTransform(x, [0, 110], [0, 1]);
    const nopeOpacity = useTransform(x, [-110, 0], [1, 0]);
    const leavingRef = useRef(false);
    const [isLeaving, setIsLeaving] = useState(false);

    const swipe = useCallback(
      async (direction: SwipeDirection) => {
        if (leavingRef.current) return;

        leavingRef.current = true;
        setIsLeaving(true);
        const target =
          direction === "right"
            ? window.innerWidth * 1.3
            : -window.innerWidth * 1.3;

        await animate(x, target, {
          duration: 0.28,
          ease: "easeIn",
        });
        onSwiped(profile.id, direction);
      },
      [onSwiped, profile.id, x],
    );

    useImperativeHandle(ref, () => ({ swipe }), [swipe]);

    function handleDragEnd(
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: { offset: { x: number }; velocity: { x: number } },
    ) {
      if (leavingRef.current) return;

      if (Math.abs(info.offset.x) > 110 || Math.abs(info.velocity.x) > 500) {
        const signal =
          Math.abs(info.offset.x) >= Math.abs(info.velocity.x)
            ? info.offset.x
            : info.velocity.x;
        void swipe(signal >= 0 ? "right" : "left");
      } else {
        void animate(x, 0, {
          type: "spring",
          stiffness: 400,
          damping: 28,
        });
      }
    }

    return (
      <motion.article
        data-testid={isTop ? "top-card" : "next-card"}
        className="absolute inset-0 overflow-hidden rounded-card border-[2.5px] border-coy-ink bg-coy-lavender"
        style={isTop ? { x, rotate } : undefined}
        initial={isTop ? { opacity: 0, y: 8, scale: 0.98 } : undefined}
        animate={
          isTop
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 1, y: 12, scale: 0.96 }
        }
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        drag={isTop ? "x" : false}
        dragListener={isTop && !isLeaving}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.9}
        dragMomentum={false}
        onDragStart={() => x.stop()}
        onDragEnd={isTop ? handleDragEnd : undefined}
        aria-label={`${profile.name}, ${profile.age}`}
      >
        <img
          src={avatarUrl(profile.id)}
          alt={`${profile.name}'s profile`}
          className="absolute inset-0 h-full w-full object-cover"
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
        <div className="absolute inset-x-0 bottom-0 z-10 h-3/5 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
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
  },
);

function LoadingCard() {
  return (
    <div className="h-full w-full animate-pulse rounded-card border-[2.5px] border-coy-ink bg-coy-lavender p-5">
      <div className="h-full rounded-[18px] bg-white/70" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="ink-surface flex h-full w-full flex-col items-center justify-center rounded-card bg-coy-mint px-8 text-center">
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

function relativeTime(value: string): string {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

function Confetti() {
  const colors = ["bg-coy-pink", "bg-coy-mint", "bg-coy-lavender", "bg-coy-ink"];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 30 }, (_, index) => (
        <span
          key={index}
          className={`coy-confetti absolute h-3 w-2 rounded-sm ${colors[index % colors.length]}`}
          style={{
            left: `${(index * 37) % 100}%`,
            top: `${(index * 19) % 45}%`,
            animationDelay: `${(index % 8) * 0.12}s`,
            transform: `rotate(${(index * 29) % 180}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export function DiscoverDeck({ onMatch }: DiscoverDeckProps) {
  const [activeTab, setActiveTab] = useState<"swipe" | "matches">("swipe");
  const [cards, setCards] = useState<PublicProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingMatches, setPendingMatches] = useState<
    NonNullable<SwipeResponse["match"]>[]
  >([]);
  const topCardRef = useRef<SwipeCardHandle>(null);
  const cardsRef = useRef<PublicProfile[]>([]);
  const requestQueueRef = useRef<Promise<void>>(Promise.resolve());
  const dialogOpenRef = useRef(false);
  const matchPrimaryRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null);
  const [hasNewMatch, setHasNewMatch] = useState(false);
  const [canReset, setCanReset] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3600);
  }, []);

  const fetchFeed = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/feed");
      if (!response.ok) throw new Error("Could not load your discover feed.");
      setCards((await response.json()) as PublicProfile[]);
    } catch {
      showToast("We couldn’t load the deck. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const fetchMatches = useCallback(async () => {
    setMatchesLoading(true);
    setMatchesError(false);

    try {
      const response = await fetch("/api/matches");
      if (!response.ok) throw new Error("Could not load matches.");
      setMatches((await response.json()) as MatchItem[]);
    } catch {
      setMatchesError(true);
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  const activeMatch = pendingMatches[0];

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    dialogOpenRef.current =
      pendingMatches.length > 0 || selectedMatch !== null;
  }, [pendingMatches.length, selectedMatch]);

  useEffect(() => {
    // The fetch callback is the external synchronization point for initial data.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchFeed();
  }, [fetchFeed]);

  const closeMatchOverlay = useCallback(() => {
    setPendingMatches((current) => current.slice(1));
  }, []);

  useEffect(() => {
    if (!activeMatch) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => matchPrimaryRef.current?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [activeMatch]);

  useEffect(() => {
    if (!activeMatch) return;

    function handleOverlayKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMatchOverlay();
      }
    }

    window.addEventListener("keydown", handleOverlayKeyDown);
    return () => window.removeEventListener("keydown", handleOverlayKeyDown);
  }, [activeMatch, closeMatchOverlay]);

  useEffect(() => {
    if (!selectedMatch) return;

    function handleSheetKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedMatch(null);
      }
    }

    window.addEventListener("keydown", handleSheetKeyDown);
    return () => window.removeEventListener("keydown", handleSheetKeyDown);
  }, [selectedMatch]);

  const openMatches = useCallback(() => {
    setActiveTab("matches");
    setHasNewMatch(false);
    void fetchMatches();
  }, [fetchMatches]);

  const resetDemo = useCallback(async () => {
    if (!window.confirm("Reset the demo and start swiping fresh?")) return;

    setIsResetting(true);
    try {
      const response = await fetch("/api/reset", { method: "POST" });
      if (response.status === 403 || response.status === 404) {
        setCanReset(false);
        return;
      }
      if (!response.ok) throw new Error("Could not reset the demo.");

      setPendingMatches([]);
      setMatches([]);
      setSelectedMatch(null);
      setHasNewMatch(false);
      await fetchFeed();
    } catch {
      showToast("The demo could not be reset.");
    } finally {
      setIsResetting(false);
    }
  }, [fetchFeed, showToast]);

  const enqueueSwipe = useCallback(
    (profile: PublicProfile, direction: SwipeDirection) => {
      const request = async () => {
        try {
          const response = await fetch("/api/swipe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              targetId: profile.id,
              direction: direction === "right" ? "LIKE" : "PASS",
            }),
          });

          if (!response.ok) throw new Error("Swipe failed.");

          const result = (await response.json()) as SwipeResponse;
          onMatch(result);
          if (result.matched && result.match) {
            setPendingMatches((current) => [...current, result.match!]);
            setHasNewMatch(true);
            void fetchMatches();
          }
        } catch {
          setCards((current) =>
            current.some((item) => item.id === profile.id)
              ? current
              : [profile, ...current],
          );
          showToast("That didn’t stick. Your card is back.");
        }
      };

      requestQueueRef.current = requestQueueRef.current.then(request, request);
    },
    [fetchMatches, onMatch, showToast],
  );

  const onSwiped = useCallback(
    (profileId: string, direction: SwipeDirection) => {
      const profile = cardsRef.current.find((item) => item.id === profileId);
      if (!profile) return;

      setCards((current) => current.filter((item) => item.id !== profileId));
      enqueueSwipe(profile, direction);
    },
    [enqueueSwipe],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.repeat ||
        dialogOpenRef.current ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        topCardRef.current?.swipe(
          event.key === "ArrowRight" ? "right" : "left",
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const topCard = cards[0];
  const nextCard = cards[1];
  return (
    <main className="flex min-h-0 flex-1 flex-col px-5 pb-3">
      <div className="ink-surface grid h-[48px] shrink-0 grid-cols-2 rounded-pill bg-white p-1">
        {(["swipe", "matches"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`relative rounded-pill px-4 text-sm font-bold capitalize transition-colors ${
              activeTab === tab ? "bg-coy-pink text-coy-ink" : "text-coy-muted"
            }`}
            onClick={() => (tab === "matches" ? openMatches() : setActiveTab("swipe"))}
            role="tab"
            aria-selected={activeTab === tab}
          >
            {tab}
            {tab === "matches" && hasNewMatch && activeTab !== "matches" && (
              <span
                className="absolute right-3 top-2 h-2 w-2 rounded-full bg-coy-ink"
                aria-label="New match"
              />
            )}
          </button>
        ))}
      </div>

      {activeTab === "matches" ? (
        <section className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {matchesLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-52 animate-pulse rounded-card border-[2.5px] border-coy-ink bg-coy-lavender"
                />
              ))}
            </div>
          ) : matchesError ? (
            <div className="ink-surface flex min-h-full flex-col items-center justify-center rounded-card bg-coy-lavender px-8 text-center">
              <div className="text-5xl">🫠</div>
              <h1 className="mt-4 font-heading text-2xl font-extrabold">
                Matches took a tiny nap
              </h1>
              <button
                type="button"
                className="ink-surface ink-press mt-5 min-h-11 rounded-pill bg-coy-pink px-5 text-sm font-extrabold"
                onClick={() => void fetchMatches()}
              >
                Retry
              </button>
            </div>
          ) : matches.length === 0 ? (
            <div className="ink-surface flex min-h-full flex-col items-center justify-center rounded-card bg-coy-lavender px-8 text-center">
              <div className="mb-5 flex h-24 w-24 rotate-[-6deg] items-center justify-center rounded-[28px] border-[2.5px] border-coy-ink bg-coy-mint text-5xl shadow-ink">
                💌
              </div>
              <h1 className="font-heading text-3xl font-extrabold tracking-[-0.04em]">
                No matches yet
              </h1>
              <p className="mt-3 max-w-xs text-sm leading-5 text-coy-muted">
                A match happens only when you both like each other.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {matches.map((match) => (
                <button
                  key={`${match.profile.id}-${match.createdAt}`}
                  type="button"
                  className="ink-surface ink-press overflow-hidden rounded-card bg-white text-left"
                  onClick={() => setSelectedMatch(match)}
                >
                  <img
                    src={avatarUrl(match.profile.id)}
                    alt=""
                    className="aspect-square w-full border-b-[2.5px] border-coy-ink bg-coy-lavender object-cover"
                  />
                  <span className="block p-3">
                    <strong className="block truncate font-heading text-lg font-extrabold">
                      {match.profile.name}, {match.profile.age}
                    </strong>
                    <span className="mt-1 block truncate text-xs font-bold text-coy-muted">
                      {match.profile.city}
                    </span>
                    <span className="mt-2 block text-[11px] font-bold text-coy-muted">
                      Matched {relativeTime(match.createdAt)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="relative mt-4 min-h-0 flex-1" aria-live="polite">
            {isLoading ? (
              <LoadingCard />
            ) : !topCard ? (
              <EmptyState />
            ) : (
              <div className="relative mx-auto h-full w-full max-h-[640px]">
                {nextCard && (
                  <ProfileCard
                    key={nextCard.id}
                    profile={nextCard}
                    isTop={false}
                    onSwiped={onSwiped}
                  />
                )}
                <ProfileCard
                  key={topCard.id}
                  ref={topCardRef}
                  profile={topCard}
                  isTop
                  onSwiped={onSwiped}
                />
              </div>
            )}
          </section>

          <div className="mt-4 flex h-[76px] shrink-0 items-center justify-center gap-5">
            {topCard ? (
              <>
                <button
                  type="button"
                  data-testid="pass-button"
                  onClick={() => topCardRef.current?.swipe("left")}
                  className="ink-surface ink-press flex h-14 w-14 items-center justify-center rounded-full bg-white text-coy-pink"
                  aria-label="Pass on this profile"
                >
                  <X size={28} strokeWidth={3} />
                </button>
                <button
                  type="button"
                  data-testid="like-button"
                  onClick={() => topCardRef.current?.swipe("right")}
                  className="ink-surface ink-press flex h-[72px] w-[72px] items-center justify-center rounded-full bg-coy-pink text-coy-ink"
                  aria-label="Like this profile"
                >
                  <Heart size={30} strokeWidth={2.7} fill="currentColor" />
                </button>
              </>
            ) : (
              <div className="h-full" aria-hidden="true" />
            )}
          </div>
          <p className="h-5 shrink-0 text-center text-xs font-bold text-coy-muted">
            {topCard ? "Use ← → or drag a card" : ""}
          </p>
          {canReset && (
            <button
              type="button"
              className="mx-auto mt-1 h-6 shrink-0 px-3 text-xs font-bold text-coy-muted underline decoration-coy-pink decoration-2 underline-offset-2"
              onClick={() => void resetDemo()}
              disabled={isResetting}
            >
              {isResetting ? "Resetting…" : "Reset demo"}
            </button>
          )}
        </>
      )}

      {activeMatch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-coy-lavender px-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeMatchOverlay();
          }}
        >
          <Confetti />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="match-title"
            className="ink-surface relative w-full max-w-[390px] rounded-card bg-coy-bg p-6 text-center"
          >
            <img
              src={avatarUrl(activeMatch.profile.id)}
              alt=""
              className="mx-auto h-28 w-28 rounded-full border-[2.5px] border-coy-ink bg-coy-lavender p-1"
            />
            <p
              id="match-title"
              className="mt-5 rotate-[-3deg] font-heading text-5xl font-extrabold tracking-[-0.06em]"
            >
              It&apos;s a match!
            </p>
            <p className="mt-2 text-sm text-coy-muted">
              You and {activeMatch.profile.name} liked each other.
            </p>
            <button
              type="button"
              ref={matchPrimaryRef}
              className="ink-surface ink-press mt-6 rounded-pill bg-coy-pink px-5 py-3 text-sm font-extrabold"
              onClick={closeMatchOverlay}
            >
              Keep swiping
            </button>
            <button
              type="button"
              className="ink-press ml-2 min-h-11 rounded-pill border-[2.5px] border-coy-ink bg-coy-lavender px-4 py-3 text-sm font-extrabold shadow-ink"
              onClick={() => {
                setPendingMatches([]);
                openMatches();
              }}
            >
              View matches
            </button>
          </section>
        </div>
      )}

      {selectedMatch && (
        <div
          className="fixed inset-0 z-40 flex items-end bg-coy-ink/40"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedMatch(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            className="ink-surface w-full rounded-t-[24px] bg-coy-bg p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-heading text-3xl font-extrabold tracking-[-0.04em]">
                  {selectedMatch.profile.name}, {selectedMatch.profile.age}
                </h2>
                <p className="mt-1 flex items-center gap-1 text-sm font-bold text-coy-muted">
                  <MapPin size={15} strokeWidth={2.5} />
                  {selectedMatch.profile.city}
                </p>
              </div>
              <button
                type="button"
                className="ink-surface ink-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white"
                aria-label="Close profile"
                onClick={() => setSelectedMatch(null)}
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>
            <p className="mt-4 text-sm leading-5 text-coy-muted">
              {selectedMatch.profile.bio}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {selectedMatch.profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-pill border-2 border-coy-ink bg-coy-mint px-3 py-1 text-xs font-bold"
                >
                  {interest}
                </span>
              ))}
            </div>
          </section>
        </div>
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-pill border-[2.5px] border-coy-ink bg-coy-ink px-4 py-2 text-sm font-bold text-white shadow-ink"
        >
          {toast}
        </div>
      )}
    </main>
  );
}
