import { db } from "@/db";
import { transcriptions } from "@/db/schema";
import { withAdmin } from "@/lib/withAdmin";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdmin(async function (req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = (page - 1) * limit;

  // Fetch sample transcriptions
  const sampleTranscriptions = await db
    .select({
      id: transcriptions.id,
      documentName: transcriptions.documentName,
      translation: transcriptions.translation,
      summary: transcriptions.summary,
      createdAt: transcriptions.createdAt,
      audioDuration: transcriptions.audioDuration,
      isDefault: transcriptions.isDefault,
    })
    .from(transcriptions)
    .where(eq(transcriptions.isDefault, true))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(transcriptions)
    .where(eq(transcriptions.isDefault, true));

  return NextResponse.json({
    data: sampleTranscriptions,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  });
});
