import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { SwipeDirection } from "@/generated/prisma/client";
import type { Database } from "@/lib/seed-data";
import { isUniqueConstraintError, ServiceError } from "@/lib/services/errors";
import {
  publicProfileSelect,
  type MatchResult,
  type PublicProfile,
} from "@/lib/services/types";

const swipeInputSchema = z.object({
  targetId: z.string().min(1),
  direction: z.enum(["LIKE", "PASS"]),
});

export type SwipeInput = z.infer<typeof swipeInputSchema>;

function sortedUserIds(first: string, second: string): [string, string] {
  return [first, second].sort() as [string, string];
}

function matchWhere(userId: string, targetId: string) {
  const [userAId, userBId] = sortedUserIds(userId, targetId);
  return { userAId_userBId: { userAId, userBId } };
}

function matchedResult(
  match: { id: string; createdAt: Date },
  profile: PublicProfile,
): MatchResult {
  return {
    matched: true,
    match: { id: match.id, createdAt: match.createdAt, profile },
  };
}

async function existingOutcome(
  db: Database,
  target: PublicProfile,
): Promise<MatchResult> {
  const match = await db.match.findUnique({
    where: matchWhere("me", target.id),
    select: { id: true, createdAt: true },
  });

  return match ? matchedResult(match, target) : { matched: false };
}

async function createMatchIfNeeded(
  db: Database,
  target: PublicProfile,
  direction: SwipeDirection,
): Promise<MatchResult> {
  if (direction !== SwipeDirection.LIKE) {
    return { matched: false };
  }

  const reciprocal = await db.swipe.findUnique({
    where: {
      swiperId_targetId: {
        swiperId: target.id,
        targetId: "me",
      },
    },
    select: { direction: true },
  });

  if (reciprocal?.direction !== SwipeDirection.LIKE) {
    return { matched: false };
  }

  await db.match.createMany({
    data: {
      ...(() => {
        const [userAId, userBId] = sortedUserIds("me", target.id);
        return { userAId, userBId };
      })(),
    },
    skipDuplicates: true,
  });

  const match = await db.match.findUnique({
    where: matchWhere("me", target.id),
    select: { id: true, createdAt: true },
  });

  return match ? matchedResult(match, target) : { matched: false };
}

export async function swipe(
  db: PrismaClient,
  input: unknown,
): Promise<MatchResult> {
  const parsed = swipeInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new ServiceError("Invalid swipe payload", 400);
  }

  const { targetId, direction } = parsed.data;

  if (targetId === "me") {
    throw new ServiceError("Unknown target", 404);
  }

  const target = await db.user.findUnique({
    where: { id: targetId },
    select: publicProfileSelect,
  });

  if (!target) {
    throw new ServiceError("Unknown target", 404);
  }

  const existing = await db.swipe.findUnique({
    where: {
      swiperId_targetId: {
        swiperId: "me",
        targetId,
      },
    },
    select: { direction: true },
  });

  if (existing) {
    return existingOutcome(db, target);
  }

  try {
    return await db.$transaction(
      async (transaction) => {
        await transaction.swipe.create({
          data: {
            swiperId: "me",
            targetId,
            direction: direction === "LIKE"
              ? SwipeDirection.LIKE
              : SwipeDirection.PASS,
          },
        });

        return createMatchIfNeeded(
          transaction,
          target,
          direction as SwipeDirection,
        );
      },
      { maxWait: 20_000, timeout: 30_000 },
    );
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const racedSwipe = await db.swipe.findUnique({
      where: {
        swiperId_targetId: {
          swiperId: "me",
          targetId,
        },
      },
      select: { direction: true },
    });

    if (!racedSwipe) {
      throw error;
    }

    return existingOutcome(db, target);
  }
}
