import { lucia } from "@/auth";
import { db } from "@/db";
import { userTable } from "@/db/schema";
import { signinUserSchema } from "@/validators/register";
import { verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password, userEmail } = signinUserSchema.parse(body);

    // check if user exists
    const existingUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.username, userEmail));

    if (!existingUser[0]) {
      return new Response("User not found", {
        status: 404,
      });
    }

    // login user
    const validPassword = await verify(
      existingUser[0].password_hash,
      password,
      {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      }
    );
    if (!validPassword) {
      return new Response("Incorrect username or password", { status: 401 });
    }

    const session = await lucia.createSession(existingUser[0].id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    return new Response("User Logged In", { status: 200 });
  } catch (error) {
    console.log(error);

    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 422 });
    }
    return new Response("Failed to Register User", { status: 500 });
  }
}
