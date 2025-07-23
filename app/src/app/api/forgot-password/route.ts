import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { passwordResetTokens, userTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";
import { forgotPasswordSchema } from "@/Validators/resetPassword";

const RESET_TOKEN_EXPIRY_MINUTES = 60; // 1 hour

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userEmail } = forgotPasswordSchema.parse({ userEmail: body.email });
    if (!userEmail) return NextResponse.json({ success: false, error: "Email required" }, { status: 400 });

    // Check if user exists
    const [user] = await db.select().from(userTable).where(eq(userTable.username, userEmail));
    if (!user) {
      return NextResponse.json({ success: false, error: "Email not found. Please sign up first." }, { status: 404 });
    }

    // Generate a secure token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

    // Upsert the token for this email
    await db.insert(passwordResetTokens).values({
      userEmail: userEmail,
      token,
      expiresAt,
    }).onConflictDoUpdate({
      target: passwordResetTokens.userEmail,
      set: { token, expiresAt },
    });

    // Send email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    if (!process.env.APP_URL) {
      return NextResponse.json({ success: false, error: "APP_URL not set" }, { status: 422 });
    }

    const appUrl = process.env.APP_URL
    const resetLink = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(userEmail)}`;
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: userEmail,
      subject: "Reset your Lingo.ai password",
      html: `<p>You requested a password reset for Lingo.ai.</p>
             <p><a href="${resetLink}">Click here to reset your password</a></p>
             <p>This link will expire in 1 hour.</p>`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
} 