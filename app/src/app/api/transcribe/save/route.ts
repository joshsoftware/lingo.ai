import { db } from "@/db";
import { transcriptions, TranscriptionsPayload, userTable } from "@/db/schema";
import { crmLeadsTable } from "@/db/schema"; // Import crmLeadsTable explicitly
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
      segments,
      // CRM data
      leadId,
      crmUrl,
      extractedData,
      isDefault,
     
    } = body; // Remove the TypeScript type annotation

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
      segments
    }).returning();
    
    // If lead ID exists, save CRM data
    if (leadId) {
      try {
        console.log("Saving CRM lead data for lead ID:", leadId);
        
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
        
        console.log("CRM lead data saved successfully");
      } catch (crmError) {
        console.error("Error saving CRM lead data:", crmError);
        // Continue with the response even if CRM save fails
      }
    }

    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify(error), { status: 500 });
  }
}