import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedDatabase } from "../src/lib/seed-data";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

seedDatabase(prisma)
  .then(async () => {
    const [userCount, swipeCount, matchCount] = await Promise.all([
      prisma.user.count(),
      prisma.swipe.count(),
      prisma.match.count(),
    ]);

    console.log(`Users: ${userCount}`);
    console.log(`Swipes: ${swipeCount}`);
    console.log(`Matches: ${matchCount}`);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
