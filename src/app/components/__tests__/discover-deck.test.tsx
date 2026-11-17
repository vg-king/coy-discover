// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PublicProfile } from "@/lib/services/types";
import { DiscoverDeck } from "@/app/components/discover-deck";

vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>(
    "framer-motion",
  );

  return {
    ...actual,
    animate: vi.fn(() => Promise.resolve()),
  };
});

function profile(id: string, name: string): PublicProfile {
  return {
    id,
    name,
    age: 22,
    photoUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${id}`,
    bio: "A test profile",
    city: "Test City",
    interests: ["Testing"],
  };
}

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    json: async () => body,
  } as Response;
}

describe("DiscoverDeck swipe interaction", () => {
  const profiles = [
    profile("u1", "Alpha"),
    profile("u2", "Bravo"),
    profile("u3", "Charlie"),
    profile("u4", "Delta"),
  ];

  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps swiping while the previous POST is delayed and preserves direction order", async () => {
    const postBodies: { targetId: string; direction: string }[] = [];
    let resolveFirstPost: (() => void) | undefined;
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) === "/api/feed") {
        return Promise.resolve(jsonResponse(profiles));
      }

      const body = JSON.parse(String(init?.body)) as {
        targetId: string;
        direction: string;
      };
      postBodies.push(body);

      if (postBodies.length === 1) {
        return new Promise<Response>((resolve) => {
          resolveFirstPost = () => resolve(jsonResponse({ matched: false }));
          window.setTimeout(
            () => resolve(jsonResponse({ matched: false })),
            3000,
          );
        });
      }

      return Promise.resolve(jsonResponse({ matched: false }));
    });

    vi.stubGlobal("fetch", fetchMock);
    render(<DiscoverDeck onMatch={vi.fn()} />);

    await waitFor(() =>
      expect(screen.getByTestId("top-card").textContent).toContain("Alpha"),
    );

    fireEvent.click(screen.getByTestId("pass-button"));
    await waitFor(() =>
      expect(screen.getByTestId("top-card").textContent).toContain("Bravo"),
    );

    fireEvent.click(screen.getByTestId("like-button"));
    await waitFor(() =>
      expect(screen.getByTestId("top-card").textContent).toContain("Charlie"),
    );

    fireEvent.keyDown(window, { key: "ArrowRight" });
    await waitFor(() =>
      expect(screen.getByTestId("top-card").textContent).toContain("Delta"),
    );

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    await waitFor(() =>
      expect(screen.queryByTestId("top-card")).toBeNull(),
    );

    expect(postBodies).toEqual([
      { targetId: "u1", direction: "PASS" },
    ]);

    resolveFirstPost?.();
    await waitFor(
      () => {
        expect(postBodies).toEqual([
          { targetId: "u1", direction: "PASS" },
          { targetId: "u2", direction: "LIKE" },
          { targetId: "u3", direction: "LIKE" },
          { targetId: "u4", direction: "PASS" },
        ]);
      },
      { timeout: 5000 },
    );
  });
});
