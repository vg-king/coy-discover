import { PrismaPg } from "@prisma/adapter-pg";
import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import {
  PrismaClient,
  SwipeDirection,
} from "@/generated/prisma/client";
import { seedDatabase } from "@/lib/seed-data";
import { getFeed } from "@/lib/services/feed";
import { getMatches } from "@/lib/services/matches";
import { resetDemo } from "@/lib/services/reset";
import { swipe } from "@/lib/services/swipe";

const adapter = new PrismaPg({
  connectionString: process.env.TEST_DATABASE_URL,
});
const db = new PrismaClient({ adapter });

beforeAll(async () => {
  await db.$connect();
});

beforeEach(async () => {
  await seedDatabase(db);
});

afterAll(async () => {
  await db.$disconnect();
});

describe("feed", () => {
  it("does not contain profiles already swiped by me", async () => {
    await swipe(db, { targetId: "u1", direction: "PASS" });
    await swipe(db, { targetId: "u2", direction: "LIKE" });

    const feed = await getFeed(db);

    expect(feed.map((profile) => profile.id)).not.toContain("u1");
    expect(feed.map((profile) => profile.id)).not.toContain("u2");
  });

  it("returns the same public key set regardless of inbound like", async () => {
    const feed = await getFeed(db);
    const likedProfile = feed.find((profile) => profile.id === "u3");
    const otherProfile = feed.find((profile) => profile.id === "u1");

    expect(likedProfile).toBeDefined();
    expect(otherProfile).toBeDefined();
    expect(Object.keys(likedProfile ?? {}).sort()).toEqual(
      Object.keys(otherProfile ?? {}).sort(),
    );
  });

  it("keeps feed order independent of inbound like rows", async () => {
    const initialOrder = (await getFeed(db)).map((profile) => profile.id);

    await db.swipe.deleteMany({
      where: { targetId: "me" },
    });
    const orderWithoutInboundLikes = (await getFeed(db)).map(
      (profile) => profile.id,
    );

    expect(orderWithoutInboundLikes).toEqual(initialOrder);
  });
});

describe("swipes and matches", () => {
  it("is idempotent for repeated swipes", async () => {
    const first = await swipe(db, { targetId: "u1", direction: "LIKE" });
    const second = await swipe(db, { targetId: "u1", direction: "PASS" });
    const count = await db.swipe.count({
      where: { swiperId: "me", targetId: "u1" },
    });

    expect(second).toEqual(first);
    expect(count).toBe(1);
  });

  it("creates matches only for two LIKE swipes", async () => {
    const oneWay = await swipe(db, { targetId: "u1", direction: "LIKE" });
    expect(oneWay).toEqual({ matched: false });
    expect(await db.match.count()).toBe(0);

    const matched = await swipe(db, { targetId: "u3", direction: "LIKE" });
    expect(matched.matched).toBe(true);

    await swipe(db, { targetId: "u2", direction: "PASS" });
    await db.swipe.create({
      data: {
        swiperId: "u2",
        targetId: "me",
        direction: SwipeDirection.LIKE,
      },
    });

    expect(await db.match.count()).toBe(1);
  });

  it("excludes one-way likes from matches", async () => {
    const matches = await getMatches(db);
    expect(matches).toEqual([]);
  });

  it("creates one swipe and at most one match for concurrent duplicates", async () => {
    await db.swipe.create({
      data: {
        swiperId: "u1",
        targetId: "me",
        direction: SwipeDirection.LIKE,
      },
    });

    await Promise.all(
      Array.from({ length: 5 }, () =>
        swipe(db, { targetId: "u1", direction: "LIKE" }),
      ),
    );

    expect(
      await db.swipe.count({
        where: { swiperId: "me", targetId: "u1" },
      }),
    ).toBe(1);
    expect(await db.match.count()).toBeLessThanOrEqual(1);
  });

  it("uses identical response keys for a one-way like and pass", async () => {
    const likeResponse = await swipe(db, { targetId: "u1", direction: "LIKE" });
    const passResponse = await swipe(db, { targetId: "u2", direction: "PASS" });

    expect(Object.keys(likeResponse).sort()).toEqual(
      Object.keys(passResponse).sort(),
    );
    expect(likeResponse).toEqual({ matched: false });
    expect(passResponse).toEqual({ matched: false });
  });

  it("resets the demo in a batch and can reset repeatedly", async () => {
    await swipe(db, { targetId: "u3", direction: "LIKE" });
    expect(await db.match.count()).toBe(1);

    await resetDemo(db);
    await resetDemo(db);

    expect(await db.user.count()).toBe(33);
    expect(await db.swipe.count()).toBe(7);
    expect(
      await db.swipe.count({
        where: { direction: SwipeDirection.LIKE, targetId: "me" },
      }),
    ).toBe(7);
    expect(await db.match.count()).toBe(0);
  });
});
