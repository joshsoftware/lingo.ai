import { validateRequest } from "@/auth";
import { db } from "@/db";
import { interviewAnalysis, interviewAnalysisPayload } from "@/db/schema";
import { z } from "zod";

export async function POST(req: Request) {
    try {

        const { user } = await validateRequest()
        if(!user) {
            return new Response(JSON.stringify("UnAuthorized"), { status: 400 });
        }
        const body = await req.json();
        const {
            candidateName,
            interviewRecordingLink,
            jobDescriptionDocumentLink,
        }: interviewAnalysisPayload = body;

        const response = await db.insert(interviewAnalysis).values({
            candidateName,
            interviewRecordingLink,
            jobDescriptionDocumentLink,
            userID: user?.id,
        }).returning();

        return new Response(JSON.stringify(response), { status: 200 });

    } catch (error) {
        console.log(error);

        if (error instanceof z.ZodError) {
            return new Response(error.message, { status: 422 });
        }
        return new Response("Failed to save error analysis", { status: 500 });
    }
}
