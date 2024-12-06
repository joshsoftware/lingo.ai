import axios from "axios";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const BASE_URL = process.env.NEXT_PUBLIC_MICROSERVICE_URL;

    const response = await axios.post(BASE_URL + '/analyse_error', req);
    if (response.status == 200) {
      return new Response(response.data, {status: 200});
    } else {
      return new Response("Failed to analyse error, please try again", { status: 500 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log(error);
      throw new Error(error?.message ?? "Internal Server Error");
    }
    throw new Error("Failed to analyse error, please try again in some time");
  }
}
