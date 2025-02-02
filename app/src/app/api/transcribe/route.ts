import { transcribeDocumentSchema } from "@/Validators/document";
import axios from "axios";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { documentUrl } = transcribeDocumentSchema.parse(body);

    // get microservice url from env
    const BASE_URL = process.env.NEXT_PUBLIC_MICROSERVICE_URL;

    if (!BASE_URL) {
      return new Response("Microservice URL not found", { status: 500 });
    }

    console.log("BASE_URL", documentUrl);

    const {data,status:transcriptionStatus} = await axios.post(BASE_URL+ '/upload-audio',{
        audio_file_link: documentUrl,
    })


    if(transcriptionStatus !== 200){
      return new Response("Internal server error", { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.log(error);
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 422 });
    }

    return new Response("Internal Server Error", { status: 500 });
  }
}
