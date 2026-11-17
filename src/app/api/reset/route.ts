import { prisma } from "@/lib/prisma";
import { serviceErrorResponse } from "@/lib/api-response";
import { resetDemo } from "@/lib/services/reset";

export async function POST() {
  if (process.env.ENABLE_DEMO_RESET === "false") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await resetDemo(prisma);
    return Response.json({ ok: true });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
