import { registry } from "@/lib/metrics";

export const runtime = "nodejs";

export async function GET() {
  const metrics = await registry.metrics();

  return new Response(metrics, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4",
    },
  });
}

