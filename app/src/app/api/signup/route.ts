import { lucia } from "@/auth";
import { db } from "@/db";
import { registrations, userTable } from "@/db/schema";
import { registerUserSchema } from "@/Validators/register";
import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { password, userEmail, userName, contact } = registerUserSchema.parse(body);

    // check if user already exists
    const user = await db
      .select({
        id: userTable.id,
      })
      .from(userTable)
      .where(eq(userTable.username, userEmail));

    if (user.length > 0)
      return new Response("User already exists", {
        status: 409,
      });

    // register user

    // generate id from hash
    const passwordHash = await hash(password, {
      // recommended minimum parameters
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1
    });

    const userId = generateIdFromEntropySize(10); // 16 characters long

    const response = await db
      .insert(userTable)
      .values({
        id: userId,
        username:userEmail,
        password_hash: passwordHash,
        name: userName || "",
        contactNumber: contact || "",
      })
      .returning();

    if (response) {
      const session = await lucia.createSession(userId, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

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
