import { NextResponse } from "next/server";
import { db } from "@/db";
import { transcriptions, subscriptionTable, userTable } from "@/db/schema";
import { validateRequest } from "@/auth";
import { sql, eq } from "drizzle-orm";
import { withHttpMetrics } from "@/lib/metrics";
import { trackDb } from "@/lib/trackDb";

async function handler() {
  const { user } = await validateRequest();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  const totalResult = await trackDb("select", "Transcription", () =>
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(transcriptions)
      .where(eq(transcriptions.userID, userId))
  );

  const totalRecords = totalResult[0]?.count ?? 0;

  const sampleResult = await trackDb("select", "Transcription", () =>
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(transcriptions)
      .where(eq(transcriptions.isDefault, true))
  );

  const sampleCount = sampleResult[0]?.count ?? 0;

  const [subscriptionInfo] = await trackDb("select", "Subscription", () =>
    db
      .select({
        name: subscriptionTable.name,
        recordingCount: subscriptionTable.recordingCount,
        fileSizeLimitMB: subscriptionTable.fileSizeLimitMB,
        durationDays: subscriptionTable.durationDays,
      })
      .from(subscriptionTable)
      .innerJoin(
        userTable,
        eq(userTable.subscriptionId, subscriptionTable.id)
      )
      .where(eq(userTable.id, userId))
  );

  if (!subscriptionInfo) {
    return NextResponse.json(
      { error: "Subscription not found for user" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    email: user.username,
    sampleCount,
    totalRecords,
    subscription: {
      name: subscriptionInfo.name,
      limit: subscriptionInfo.recordingCount,
      remaining: Math.max(subscriptionInfo.recordingCount - totalRecords, 0),
      fileSizeLimitMB: subscriptionInfo.fileSizeLimitMB,
      durationDays: subscriptionInfo.durationDays,
    },
  });
}

export const GET = withHttpMetrics("api/profile/summary", handler);
