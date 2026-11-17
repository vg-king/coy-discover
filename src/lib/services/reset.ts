import type { PrismaClient } from "@/generated/prisma/client";
import { seedDatabase } from "@/lib/seed-data";

export async function resetDemo(db: PrismaClient): Promise<void> {
  await db.$transaction(async (transaction) => {
    await seedDatabase(transaction);
  });
}
