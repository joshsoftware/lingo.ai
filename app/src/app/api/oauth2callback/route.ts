// src/app/api/oauth2callback/route.ts
// This handles the callback from Google OAuth

import { getDecodedCookie } from "@/utils/cookies";
import { google } from "googleapis";
import { cookies } from "next/headers";

import { db } from "@/db";
import { botTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { lucia } from "@/auth";

export async function GET(request: Request) {
  // Build redirect URI from request origin to match the one used when generating the auth URL
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/oauth2callback`;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Continue handling the request
  // Get the code from the query parameters
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return new Response(JSON.stringify({ error: "Code not found" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
  // Exchange the code for tokens
  const { tokens } = await oauth2Client.getToken(code);

    // Set the credentials on the OAuth client
    oauth2Client.setCredentials(tokens);

    // Store tokens in cookies (in production, use more secure storage)
    const cookieStore = await cookies();
    if (tokens.access_token) {
      cookieStore.set("google_access_token", tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: tokens.expiry_date
          ? (tokens.expiry_date - Date.now()) / 1000
          : 3600,
        path: "/",
      });
    }

    if (tokens.refresh_token) {
      cookieStore.set("google_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      });
    }

    // Get user info from Google
    const oauth2 = google.oauth2({
      version: "v2",
      auth: oauth2Client, // Use the client with credentials already set
    });

    const { data: userInfo } = await oauth2.userinfo.get();
    const userEmail = userInfo.email;

    // Store user email in a cookie if needed
    if (userEmail) {
      cookieStore.set("user_email", userEmail, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      });
    }

    // Set isBotAdded cookie to true - matching the format used in frontend
    cookieStore.set("isBotAdded", String(true), {
      httpOnly: false, // Allow JavaScript access
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days to match frontend
    });

    // Get current session cookie
    const sessionCookie = cookieStore.get(lucia.sessionCookieName); // e.g. auth_session
    if (!sessionCookie) {
      return new Response("No active session", { status: 401 });
    }

    // Validate session and extract user ID
    const sessionResult = await lucia.validateSession(sessionCookie.value);
    if (!sessionResult.session) {
      return new Response("Invalid session", { status: 401 });
    }

    const userId = sessionResult.user.id; // Assuming 'id' is the correct property in the 'User' type

    // Create Lucia session for the user and set auth_session cookie
    cookieStore.set(sessionCookie.name, sessionCookie.value, {
      httpOnly: false, // Allow JavaScript access
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days to match frontend
    });

    try {
      await db.insert(botTable).values({
        id: userInfo.id || crypto.randomUUID(),
        userId: userId,
        botName: userInfo.name ? `${userInfo.name}'s lingo.ai bot` : "lingo.ai bot",
        botEmail: userInfo.email || null,
        botHd: userInfo.hd || "",
        botPicture: userInfo.picture || "",
        accessToken: tokens.access_token || "",
        refreshToken: tokens.refresh_token || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
    }

    // Redirect to the calendar events page
    return Response.redirect(new URL("/", process.env.GOOGLE_REDIRECT_URI));
  } catch (error) {
    console.error("OAuth error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        error: "Failed to authenticate",
        details: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
