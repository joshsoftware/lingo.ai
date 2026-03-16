import { lucia } from "@/auth";
import { db } from "@/db";
import { registrations, userTable, subscriptionTable } from "@/db/schema";
import { signupUserSchema } from "@/Validators/register";
import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import { z } from "zod";
import { withHttpMetrics } from "@/lib/metrics";
import { trackDb } from "@/lib/trackDb";

async function handler(req: Request) {
  try {
    const body = await req.json();
    const { password, userEmail, userName, contact } =
      signupUserSchema.parse(body);

    const existingUser = await trackDb("select", "User", () =>
      db
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(userTable.username, userEmail))
    );

    if (existingUser.length > 0) {
      return new Response("User already exists", { status: 409 });
    }

    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    const userId = generateIdFromEntropySize(10);

    const [freeSubscription] = await trackDb("select", "Subscription", () =>
      db
        .select({ id: subscriptionTable.id })
        .from(subscriptionTable)
        .where(eq(subscriptionTable.name, "FREE"))
    );

    if (!freeSubscription) {
      return new Response("Default subscription not found", { status: 500 });
    }

    const insertedUser = await trackDb("insert", "User", () =>
      db
        .insert(userTable)
        .values({
          id: userId,
          username: userEmail,
          password_hash: passwordHash,
          name: userName || "",
          contactNumber: contact || "",
          subscriptionId: freeSubscription.id,
        })
        .returning()
    );

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    return new Response(JSON.stringify({ userId: insertedUser[0].id }), {
      status: 201,
    });
  } catch (error) {
    console.error("Registration Error:", error);

    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 422 });
    }

    return new Response("Failed to Register User", { status: 500 });
  }
}

export const POST = withHttpMetrics("api/signup", handler);
