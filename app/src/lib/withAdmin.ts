// lib/withAdmin.ts
import { validateRequest } from "@/auth";
import { NextResponse } from "next/server";

export function withAdmin<T extends (...args: any[]) => Promise<Response>>(
  handler: T
) {
  return async (...args: Parameters<T>): Promise<Response> => {
    const { user } = await validateRequest();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handler(...args);
  };
}
