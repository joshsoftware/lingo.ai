import { db } from "@/db";
import { transcriptions, TranscriptionsPayload, userTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      documentUrl,
      userID,
      documentName,
      summary,
      translation,
      audioDuration,
    }: TranscriptionsPayload = body;

    const userResponse = await db
      .select({
        userName: userTable.name
      })
      .from(userTable)
      .where(eq(userTable.id, userID))

    if (!userResponse[0]) {
      return new Response("User not found", {
        status: 404,
      })
    }


    const response = await db.insert(transcriptions).values({
      documentUrl,
      documentName,
      userID,
      summary,
      translation,
      audioDuration,
      userName: userResponse[0].userName
    }).returning();

    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify(error), { status: 500 });
  }
}
