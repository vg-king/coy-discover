import type { Database } from "@/lib/seed-data";
import {
  publicProfileSelect,
  type PublicProfile,
} from "@/lib/services/types";

export type MatchProfile = {
  createdAt: Date;
  profile: PublicProfile;
};

export async function getMatches(db: Database): Promise<MatchProfile[]> {
  const matches = await db.match.findMany({
    where: {
      OR: [{ userAId: "me" }, { userBId: "me" }],
    },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      userAId: true,
      userBId: true,
      userA: { select: publicProfileSelect },
      userB: { select: publicProfileSelect },
    },
  });

  return matches.map((match) => ({
    createdAt: match.createdAt,
    profile: match.userAId === "me" ? match.userB : match.userA,
  }));
}
