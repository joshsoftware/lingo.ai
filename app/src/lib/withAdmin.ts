import { validateRequest } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function withAdmin<
  T extends (req: NextRequest, ctx: { params: any }) => Promise<Response>
>(handler: T) {
  return async (req: NextRequest, context: { params: any }) => {
    const { user } = await validateRequest();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handler(req, context); // ✅ Pass context (params) to your handler
  };
}
