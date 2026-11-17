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

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    dialogOpenRef.current = pendingMatches.length > 0;
  }, [pendingMatches.length]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/feed")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load your discover feed.");
        return (await response.json()) as PublicProfile[];
      })
      .then((feed) => {
        if (!cancelled) setCards(feed);
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
    [onMatch, showToast],
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
  const activeMatch = pendingMatches[0];

  return (
    <main className="flex min-h-0 flex-1 flex-col px-5 pb-3">
      <div className="ink-surface grid h-[48px] shrink-0 grid-cols-2 rounded-pill bg-white p-1">
        {(["swipe", "matches"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`rounded-pill px-4 text-sm font-bold capitalize transition-colors ${
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
        <section className="ink-surface mt-4 flex min-h-0 flex-1 flex-col items-center justify-center rounded-card bg-coy-lavender px-8 text-center">
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
          </div>
          <p className="h-5 shrink-0 text-center text-xs font-bold text-coy-muted">
            Use ← → or drag a card
          </p>
        </>
      )}

      {activeMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-coy-ink/40 px-5">
          <section
            role="dialog"
            aria-modal="true"
            className="ink-surface w-full max-w-[390px] rounded-card bg-coy-mint p-6 text-center"
          >
            <img
              src={avatarUrl(activeMatch.profile.id)}
              alt=""
              className="mx-auto h-28 w-28 rounded-full border-[2.5px] border-coy-ink bg-coy-lavender"
            />
            <p className="mt-5 font-heading text-4xl font-extrabold tracking-[-0.06em]">
              It&apos;s a match!
            </p>
            <p className="mt-2 text-sm text-coy-muted">
              You and {activeMatch.profile.name} liked each other.
            </p>
            <button
              type="button"
              className="ink-surface ink-press mt-6 rounded-pill bg-coy-pink px-5 py-3 text-sm font-extrabold"
              onClick={() =>
                setPendingMatches((current) => current.slice(1))
              }
            >
              Keep swiping
            </button>
          </section>
        </div>
      )}

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
