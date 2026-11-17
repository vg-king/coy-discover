import { prisma } from "@/lib/prisma";
import { serviceErrorResponse } from "@/lib/api-response";
import { swipe } from "@/lib/services/swipe";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return Response.json(await swipe(prisma, body));
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
