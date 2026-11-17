import { prisma } from "@/lib/prisma";
import { serviceErrorResponse } from "@/lib/api-response";
import { getMatches } from "@/lib/services/matches";

export async function GET() {
  try {
    return Response.json(await getMatches(prisma));
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
