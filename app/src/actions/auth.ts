"use server"

import { signOut, validateRequest } from "@/auth"
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function handleSignOut() {
    try {
        // First invalidate the session
        await signOut();

        // Then clear all app-related cookies
        const cookieStore = await cookies();

        // Clear httpOnly cookies (server-side)
        cookieStore.delete("google_access_token");
        cookieStore.delete("google_refresh_token");
        cookieStore.delete("user_email");

        // Clear client-accessible cookies
        cookieStore.set("isBotAdded", "", {
            expires: new Date(0),
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            httpOnly: false,
        });

        // Remove redirect here
        return { success: true };
    } catch (error) {
        console.error("Error during sign out:", error);
        throw new Error("Failed to sign out");
    }
}

export async function isSignedIn() {
    const user = await validateRequest();
    return !!user.session;
}