import { auth } from "@/auth";
import { db } from "@/db";
import { transcriptions } from "@/db/schema";
import { TranscriptionValidator } from "@/Validators/transcriptions";
import { z } from "zod";

export async function POST(req: Request){

    try {

        const session = await auth();

        const body = await req.json();

        const {documentUrl,transcription} = TranscriptionValidator.parse(body)

        if (!session) {
            return new Response('Unauthorized', { status: 401 })
        }

        await db.insert(transcriptions).values({
            userId:session.user.id,
            documentUrl,
            transcription
        })

        return new Response('File uploaded successfully', { status: 200 })

    }catch(error){
        if (error instanceof z.ZodError) {
            return new Response(error.message, { status: 422 })
        }
        return new Response('File Upload Failed please try again in some time', { status: 500 })
    }
}