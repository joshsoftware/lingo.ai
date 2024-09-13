import { db } from "@/db";
import { registrations } from "@/db/schema";
import { registerUserSchema } from "@/Validators/register";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { userEmail, userName } = registerUserSchema.parse(body);

    // check if user already exists
    const user = await db
      .select({
        id: registrations.id,
      })
      .from(registrations)
      .where(eq(registrations.userEmail, userEmail));

    if (user.length > 0)
      return new Response(JSON.stringify({ userId: user[0].id }), {
        status: 200,
      });

    // register user
    const response = await db
      .insert(registrations)
      .values({
        userEmail,
        userName,
      })
      .returning();

    if (response) {
      return new Response(JSON.stringify({ userId: response[0].id }), {
        status: 201,
      });
    }
  } catch (error) {
    console.log(error);

    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 422 });
    }
    return new Response("Failed to Register User", { status: 500 });
  }
}
