import { NextResponse } from "next/server";
import { db } from "@/db";
import { transcriptions, subscriptionTable, userTable } from "@/db/schema";
import { validateRequest } from "@/auth";
import { sql, eq } from "drizzle-orm";
import { createMetricsRecorder } from "@/lib/metrics";

export async function GET() {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  const metricsRecorder = createMetricsRecorder("/api/profile/summary", "GET").start();
  let statusCode = 200;
  let userId: string | undefined;
  
  // Log request
  console.log(`\n${'='.repeat(80)}`);
  console.log(`[REQUEST ${requestId}] GET /api/profile/summary`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  try {
    const { user } = await validateRequest();
    userId = user?.id;
    console.log(`User ID: ${user?.id || 'Anonymous'}`);

    if (!user) {
      statusCode = 401;
      console.log(`[RESPONSE ${requestId}] Status: 401 Unauthorized`);
      console.log(`Duration: ${Date.now() - startTime}ms`);
      console.log(`${'='.repeat(80)}\n`);
      metricsRecorder.end(statusCode, userId);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    console.log(`Fetching profile summary for user: ${userId}`);

    // Count total transcriptions for this user
    console.log(`Querying total transcriptions count...`);
    const totalResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(transcriptions)
      .where(eq(transcriptions.userID, userId));

    const totalRecords = totalResult[0]?.count ?? 0;
    console.log(`Total records found: ${totalRecords}`);

    // Count demo/sample recordings (isDefault = true)
    console.log(`Querying sample/demo recordings count...`);
    const sampleResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(transcriptions)
      .where(eq(transcriptions.isDefault, true));

    const sampleCount = sampleResult[0]?.count ?? 0;
    console.log(`Sample records found: ${sampleCount}`);

    console.log(`Fetching subscription information...`);
    const [subscriptionInfo] = await db
      .select({
        name: subscriptionTable.name,
        recordingCount: subscriptionTable.recordingCount,
        fileSizeLimitMB: subscriptionTable.fileSizeLimitMB,
        durationDays: subscriptionTable.durationDays,
      })
      .from(subscriptionTable)
      .innerJoin(userTable, eq(userTable.subscriptionId, subscriptionTable.id))
      .where(eq(userTable.id, userId));
      
    if (!subscriptionInfo) {
      statusCode = 500;
      console.log(`[RESPONSE ${requestId}] Status: 500 - Subscription not found`);
      console.log(`Duration: ${Date.now() - startTime}ms`);
      console.log(`${'='.repeat(80)}\n`);
      metricsRecorder.end(statusCode, userId, "Subscription not found");
      return NextResponse.json(
        { error: "Subscription not found for user" },
        { status: 500 }
      );
    }

    const responseData = {
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
    };
    
    statusCode = 200;
    console.log(`[RESPONSE ${requestId}] Status: 200 OK`);
    console.log(`Response Data:`, JSON.stringify(responseData, null, 2));
    console.log(`Duration: ${Date.now() - startTime}ms`);
    console.log(`${'='.repeat(80)}\n`);
    
    metricsRecorder.end(statusCode, userId);
    return NextResponse.json(responseData);
  } catch (error) {
    statusCode = 500;
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`\n[ERROR ${requestId}] Exception occurred after ${duration}ms`);
    console.error(`Error Type: ${error instanceof Error ? error.constructor.name : 'Unknown'}`);
    console.error(`Error Message: ${errorMessage}`);
    console.error(`Stack:`, error instanceof Error ? error.stack : 'N/A');
    console.log(`${'='.repeat(80)}\n`);
    
    metricsRecorder.end(statusCode, userId, errorMessage);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
