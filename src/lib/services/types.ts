import type { Prisma } from "@/generated/prisma/client";

export const publicProfileSelect = {
  id: true,
  name: true,
  age: true,
  photoUrl: true,
  bio: true,
  city: true,
  interests: true,
} satisfies Prisma.UserSelect;

export type PublicProfile = Prisma.UserGetPayload<{
  select: typeof publicProfileSelect;
}>;

export type MatchResult = {
  matched: false;
} | {
  matched: true;
  match: {
    id: string;
    createdAt: Date;
    profile: PublicProfile;
  };
};
