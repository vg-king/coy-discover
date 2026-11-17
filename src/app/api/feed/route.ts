import { prisma } from "@/lib/prisma";
import { serviceErrorResponse } from "@/lib/api-response";
import { getFeed } from "@/lib/services/feed";

export async function GET() {
  try {
    return Response.json(await getFeed(prisma));
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
