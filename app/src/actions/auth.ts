"use server"

import { signOut, validateRequest } from "@/auth"
import { redirect } from "next/navigation";

export async function handleSignOut() {
    await signOut();
    redirect("/signin");
}


export async function isSignedIn() {
    const user = await validateRequest();
    return !!user.session;
}