import { withHttpMetrics } from "@/lib/metrics";

async function handler(req: Request) {
  return new Response(JSON.stringify({ message: "Hello World" }), {
    status: 200,
  });
}

export const GET = withHttpMetrics("api/callback/test", handler);