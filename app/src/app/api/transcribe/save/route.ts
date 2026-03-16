import { db } from "@/db";
import { transcriptions, TranscriptionsPayload, userTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { withHttpMetrics } from "@/lib/metrics";
import { trackDb } from "@/lib/trackDb";

async function handler(req: Request) {
  try {
    const body = await req.json();
    const {
      documentUrl,
      userID,
      documentName,
      summary,
      translation,
      audioDuration,
      segments,
      detectedLanguage,
    }: TranscriptionsPayload = body;

    const userResponse = await trackDb("select", "User", () =>
      db
        .select({
          userName: userTable.name,
        })
        .from(userTable)
        .where(eq(userTable.id, userID))
    );

    if (!userResponse[0]) {
      return new Response("User not found", {
        status: 404,
      });
    }

    const response = await trackDb("insert", "Transcription", () =>
      db
        .insert(transcriptions)
        .values({
          documentUrl,
          documentName,
          userID,
          summary,
          translation,
          audioDuration,
          userName: userResponse[0].userName,
          segments,
          detectedLanguage,
        })
        .returning()
    );

    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify(error), { status: 500 });
  }
}

export const POST = withHttpMetrics("api/transcribe/save", handler);

