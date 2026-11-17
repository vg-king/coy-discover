import type { PrismaClient } from "@/generated/prisma/client";
import { buildSeedOperations } from "@/lib/seed-data";

export async function resetDemo(db: PrismaClient): Promise<void> {
  await db.$transaction(buildSeedOperations(db), {
    maxWait: 10_000,
    timeout: 20_000,
  });
}
