import { prisma } from "@/lib/prisma";
import { resetDemo } from "@/lib/services/reset";

export async function POST() {
  if (process.env.ENABLE_DEMO_RESET === "false") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await resetDemo(prisma);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "reset_failed" }, { status: 500 });
  }
}
