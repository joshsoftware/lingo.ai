import { createNextAuthMiddleware } from "nextjs-basic-auth-middleware";
import { NextRequest, NextResponse } from "next/server";

/**
 * Parse BASIC_AUTH_CREDENTIALS env (format: user:password or user:password|user2:password2)
 * into users array. Package expects { name, password } per user.
 */
function getUsersFromEnv(): { name: string; password: string }[] {
  const raw = process.env.BASIC_AUTH_CREDENTIALS;
  if (!raw?.trim()) return [];
  return raw
    .split("|")
    .map((pair) => {
      const [name, ...rest] = pair.trim().split(":");
      const password = rest.join(":").trim();
      return name && password ? { name, password } : null;
    })
    .filter((u): u is { name: string; password: string } => u !== null);
}

export const config = {
  // Protect only /admin routes. Use ['/(.*)'] to protect the whole app.
  matcher: ["/admin/:path*"],
};

export default function middleware(req: NextRequest) {
  const users = getUsersFromEnv();
  // Only run basic auth when credentials are configured
  if (users.length === 0) {
    return NextResponse.next();
  }
  const authMiddleware = createNextAuthMiddleware({
    users,
    realm: "Admin",
    message: "Authentication failed",
  });
  return authMiddleware(req);
}
