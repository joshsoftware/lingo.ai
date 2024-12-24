import { lucia } from "@/auth";
import { db } from "@/db";
import { userTable } from "@/db/schema";
import { signinUserSchema } from "@/Validators/register";
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
            .where(eq(userTable.username, userEmail))

        if (existingUser.length === 0) {
            return new Response("User not found", {
                status: 404,
            })
        }
        
        const user = existingUser[0]

        // login user
        const validPassword = await verify(user.password_hash, password, {
            memoryCost: 19456,
            timeCost: 2,
            outputLen: 32,
            parallelism: 1
        });
        if (!validPassword) {
            return new Response("Incorrect username or password", { status: 401 })
        }

        const session = await lucia.createSession(user.id, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        (await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

        return new Response(JSON.stringify(user), { status: 200 });

    } catch (error) {
        console.log(error);

        if (error instanceof z.ZodError) {
            return new Response(error.message, { status: 422 });
        }
        return new Response("Failed to Register User", { status: 500 });
    }
}
