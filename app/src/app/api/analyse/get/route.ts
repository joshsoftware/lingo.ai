import { db } from "@/db";
import { eq } from "drizzle-orm";
import { interviewAnalysis } from "@/db/schema";
import axios from "axios";
import { z } from "zod";

export async function POST(req: Request) {
      try {
        const body = await req.json();
        console.log("Body ID : ", body.id);
        const analysis = await db
            .select()
            .from(interviewAnalysis)
            .where(eq(interviewAnalysis.id, body.id));

        return new Response(JSON.stringify(analysis), { status: 200 });

      } catch (error) {
          if (error instanceof z.ZodError) {
              return new Response(error.message, { status: 422 });
            }
            console.log("\n\nError : ", error);
          return new Response("Failed to fetch error analysis", { status: 500 });
      }
}
