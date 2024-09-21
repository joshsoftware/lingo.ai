import { db } from "@/db";
import { transcriptions, TranscriptionsPayload } from "@/db/schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      documentUrl,
      registrationId,
      documentName,
      summary,
      translation,
    }: TranscriptionsPayload = body;

    const response = await db.insert(transcriptions).values({
      documentUrl,
      documentName,
      registrationId,
      summary,
      translation,
    }).returning();

    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify(error), { status: 500 });
  }
}
