// src/app/api/auth/google/route.ts
import { google } from "googleapis";
import { NextRequest } from "next/server";
import { withHttpMetrics } from "@/lib/metrics";

// Create OAuth client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

async function handler(request: NextRequest) {
  const origin = request.headers.get("origin") || "*";

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "consent",
  });

  return new Response(JSON.stringify({ auth_url: authUrl }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export const GET = withHttpMetrics("api/auth/google", handler);

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
    const origin = request.headers.get('origin') || '*';

    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400', // 24 hours
        },
    });
}