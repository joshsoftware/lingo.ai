import { NextResponse } from "next/server";
import { db } from "@/db";
import { transcriptions } from "@/db/schema";
import { validateRequest } from "@/auth";
import { sql } from "drizzle-orm";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const { user } = await validateRequest();
  //   console.log("user is", user);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  // Count total transcriptions for this user
  const totalResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(transcriptions)
    .where(eq(transcriptions.userID, userId));
  //   console.log("totalResult is ", totalResult);
  // Count demo/sample recordings (isDefault = true)
  const sampleResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(transcriptions)
    .where(eq(transcriptions.isDefault, true));
  //   console.log("sampleResult", sampleResult);
  // Add user info for profile UI (optional)
  const email = user?.username;

  return NextResponse.json({
    email,
    sampleCount: sampleResult[0]?.count ?? 0,
    totalRecords: totalResult[0]?.count ?? 0,
  });
}
