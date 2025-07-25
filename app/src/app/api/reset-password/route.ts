import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { passwordResetTokens, userTable } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { hash } from "@node-rs/argon2";
import { resetPasswordSchema } from "@/Validators/resetPassword";
import { lucia } from "@/auth";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password, confirmPassword } = resetPasswordSchema.parse({ ...body, confirmPassword: body.confirmPassword ?? body.password });
    const email = body.email;
    if (!token || !email || !password) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }
    // Find the token
    const now = new Date()
    const [reset] = await db.select().from(passwordResetTokens).where(
      and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.username, email),
        gt(passwordResetTokens.expiresAt, now) // not expired
      )
    );
    if (!reset) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 400 });
    }

    // Update the user's password
    const hashed = await hash(password);
    await db.update(userTable)
      .set({ password_hash: hashed })
      .where(eq(userTable.username, email));
    // Delete the token
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    // Clear session cookie to log user out
    const sessionCookie = lucia.createBlankSessionCookie();
    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
} 