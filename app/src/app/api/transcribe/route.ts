import { transcribeDocumentSchema } from "@/Validators/document";
import axios from "axios";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    console.clear();
    const body = await req.json();

    const { documentUrl } = transcribeDocumentSchema.parse(body);

    // get microservice url from env
    const BASE_URL = process.env.NEXT_PUBLIC_MICROSERVICE_URL;

    if (!BASE_URL) {
      return new Response("Microservice URL not found", { status: 500 });
    }

    // const {data} = await axios.post(BASE_URL+'/upload-audio',{
    //     audio_file_link: documentUrl,
    // })

    const response = await fetch(BASE_URL + "/upload-audio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_file_link: documentUrl,
      }),
    });

    console.log(response);

    const data = await response.json();

    console.log(data);

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.log(error);
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 422 });
    }

    return new Response("Internal Server Error", { status: 500 });
  }
}
