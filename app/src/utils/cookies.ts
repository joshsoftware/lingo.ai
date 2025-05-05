import { cookies } from "next/headers";

type CookieOptions = {
  path?: string;
  domain?: string;
  expires?: Date;
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
};

// Set cookie with automatic encoding
export async function setEncodedCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
) {
  const cookieStore = await cookies();
  cookieStore.set(name, encodeURIComponent(value), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...options,
  });
}

// Get cookie with automatic decoding
export async function getDecodedCookie(name: string): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(name)?.value;
  return raw ? decodeURIComponent(raw) : null;
}
