import { isServiceError } from "@/lib/services/errors";

export function serviceErrorResponse(error: unknown): Response {
  if (isServiceError(error)) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  console.error(error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
