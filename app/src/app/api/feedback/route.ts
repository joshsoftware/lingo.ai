import { validateRequest } from "@/auth";
import { db } from "@/db";
import { analysisFeedback, feedbackPayload } from "@/db/schema";
import { z } from "zod";

export async function POST(req: Request) {
    try {
        const { user } = await validateRequest()
        if(!user) {
            return new Response(JSON.stringify({
                "message": "unauthorized"
            }), { status: 400 });
        }
        const body = await req.json();
        const {
            analysisId,
            isFoundUseful,
            comment
        }: feedbackPayload = body;

        const response = await db.insert(analysisFeedback).values({
            analysisId,
            isFoundUseful,
            comment,
            userID: user?.id,
        }).returning();

        return new Response(JSON.stringify(response), { status: 200 });

    } catch (error) {
        console.log(error);

        if (error instanceof z.ZodError) {
            return new Response(error.message, { status: 422 });
        }
        return new Response(JSON.stringify({
            "message": FEEDBACK_REQUEST_FAILED_MESSAGE
        }), { status: 500 });
    }
}
