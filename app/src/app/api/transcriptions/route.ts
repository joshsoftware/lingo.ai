import { db } from "@/db";
import { transcriptions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { PAGINATION_LIMIT } from "@/constants/pagination";
import { withHttpMetrics } from "@/lib/metrics";
import { trackDb } from "@/lib/trackDb";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

async function handler(req: NextRequest) {
  try {
    const cursor = parseInt(req.nextUrl.searchParams.get("cursor") || "0");
    const filter = req.nextUrl.searchParams.get("filter") || "false";
    const userId = req.nextUrl.searchParams.get("userId") || null;

    if (filter !== "true" && filter !== "false" && filter !== "user") {
      return new Response(
        JSON.stringify({
          error: "Invalid filter value. Must be 'true', 'false', or 'user'.",
        }),
        { status: 400 }
      );
    }

    const isFilter = filter === "true";
    const limit = PAGINATION_LIMIT;

    const transcriptionsData = await trackDb("select", "Transcription", () =>
      db
        .select({
          id: transcriptions.id,
          documentName: transcriptions.documentName,
          createdAt: transcriptions.createdAt,
          documentUrl: transcriptions.documentUrl,
          isDefault: transcriptions.isDefault,
          audioDuration: transcriptions.audioDuration,
          detectedLanguage: transcriptions.detectedLanguage,
        })
        .from(transcriptions)
        .where(
          filter === "user" && userId
            ? eq(transcriptions.userID, userId)
            : eq(transcriptions.isDefault, isFilter)
        )
        .orderBy(desc(transcriptions.createdAt))
        .offset(cursor)
        .limit(limit)
    );

    const nextCursor =
      transcriptionsData.length === limit ? cursor + limit : null;
    const hasTranscriptions = transcriptionsData.length > 0;

    return new Response(
      JSON.stringify({
        transcriptions: transcriptionsData,
        nextCursor,
        hasTranscriptions,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify(error), { status: 500 });
  }
}

export const GET = withHttpMetrics("api/transcriptions", handler);
