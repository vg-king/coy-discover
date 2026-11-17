import type { Database } from "@/lib/seed-data";
import {
  publicProfileSelect,
  type PublicProfile,
} from "@/lib/services/types";

export const ME_ID = "me";
const FEED_SEED = "coy-discover-feed-v1";

function stableHash(value: string): number {
  let hash = 2166136261;

  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export async function getFeed(db: Database): Promise<PublicProfile[]> {
  const profiles = await db.user.findMany({
    where: {
      id: { not: ME_ID },
      swipesReceived: {
        none: { swiperId: ME_ID },
      },
    },
    select: publicProfileSelect,
  });

  return profiles.sort((left, right) => {
    const hashDifference = stableHash(`${left.id}:${FEED_SEED}`) -
      stableHash(`${right.id}:${FEED_SEED}`);

    return hashDifference || left.id.localeCompare(right.id);
  });
}
