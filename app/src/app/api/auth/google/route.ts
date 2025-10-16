// src/app/api/auth/google/route.ts

import { google } from 'googleapis';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    // Compute origin for CORS and redirect URI
    const origin = request.headers.get('origin') || request.nextUrl.origin;

    // Build redirect URI dynamically to ensure it's always provided and matches the request origin
    const redirectUri = `${request.nextUrl.origin}/api/oauth2callback`;

    // Create OAuth client per-request so redirect_uri is set correctly
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
    );

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email' // Add this scope to get email
        ],
        prompt: 'consent',
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