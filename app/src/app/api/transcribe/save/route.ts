import { db } from "@/db";
import { transcriptions, TranscriptionsPayload, userTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { crmLeadsTable } from "@/db/schema"; // Import crmLeadsTable explicitly

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
      segments,
      detectedLanguage,
      isDefault,
    } = body;
      // CRM data
      const { leadId, crmUrl, extractedData } = body;



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
      userName: userResponse[0].userName,
      segments,
      detectedLanguage
    }).returning();
    
    // If lead ID exists, save CRM data
    if (leadId) {
      try {
        
        await db.insert(crmLeadsTable).values({
          leadId: leadId,
          crmUrl: crmUrl || "",
          fileName: documentName,
          documentUrl: documentUrl, // Make sure this field exists in your schema
          transcriptionId: response[0].id,
          extractedData: extractedData || {},
          translation: translation,
          userId: userID,
          isDefault: isDefault === true
        });
        
      } catch (crmError) {
        // Continue with the response even if CRM save fails
      }
    }

    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify(error), { status: 500 });
  }
}