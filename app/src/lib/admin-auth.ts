/**
 * Server-only: build Basic auth headers for proxying to the admin microservice.
 * Set ADMIN_BASIC_AUTH_USER and ADMIN_BASIC_AUTH_PASSWORD in env (no NEXT_PUBLIC_).
 */
export function getAdminBasicAuthHeaders(): Record<string, string> {
  const user = process.env.ADMIN_BASIC_AUTH_USER;
  const password = process.env.ADMIN_BASIC_AUTH_PASSWORD;
  if (!user || !password) return {};
  const encoded = Buffer.from(`${user}:${password}`, "utf-8").toString("base64");
  return { Authorization: `Basic ${encoded}` };
}
