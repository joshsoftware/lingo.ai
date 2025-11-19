// src/app/api/auth/google/route.ts

import { google } from 'googleapis';
import { NextRequest } from 'next/server';
import { lucia } from '@/auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    // Compute origin for CORS and redirect URI
    const origin = request.headers.get('origin') || request.nextUrl.origin;

    // Build redirect URI dynamically to ensure it's always provided and matches the request origin
    const redirectUri = `${request.nextUrl.origin}/api/oauth2callback`;

    // Validate current session and extract user ID
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(lucia.sessionCookieName);

    if (!sessionCookie) {
        return new Response(JSON.stringify({ error: 'No active session' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const sessionResult = await lucia.validateSession(sessionCookie.value);
    if (!sessionResult.session || !sessionResult.user) {
        return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userId = sessionResult.user.id;

    // Create OAuth client per-request so redirect_uri is set correctly
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email' // Add this scope to get email
        ],
        prompt: 'consent',
        state: userId, // Pass user ID as state parameter
    });

    // Return response with CORS headers
    return new Response(JSON.stringify({ auth_url: authUrl }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
    });
}

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