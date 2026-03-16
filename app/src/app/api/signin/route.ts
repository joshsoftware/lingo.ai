import { lucia } from "@/auth";
import { db } from "@/db";
import { userTable, botTable } from "@/db/schema";
import { signinUserSchema } from "@/Validators/register";
import { verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";
import { withHttpMetrics } from "@/lib/metrics";
import { trackDb } from "@/lib/trackDb";

async function handler(req: Request) {
  try {
    const body = await req.json();
    const { password, userEmail } = signinUserSchema.parse(body);

    const existingUser = await trackDb("select", "User", () =>
      db.select().from(userTable).where(eq(userTable.username, userEmail))
    );

    if (!existingUser[0]) {
      return new Response("User not found", {
        status: 404,
      });
    }

    const user = existingUser[0];

    const validPassword = await verify(user.password_hash, password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    if (!validPassword) {
      return new Response("Incorrect username or password", { status: 401 });
    }

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    const bot = await trackDb("select", "Bot", () =>
      db.select().from(botTable).where(eq(botTable.userId, user.id))
    );

    const isBotAdded = !!bot[0];

    return new Response(
      JSON.stringify({
        message: "User Logged In",
        data: {
          isBotAdded,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(error);

    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 422 });
    }

    return new Response("Failed to login user", { status: 500 });
  }
}

export const POST = withHttpMetrics("api/signin", handler);
