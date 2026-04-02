/**
 * Client-only: build Basic auth headers for admin error-logs API calls.
 * Used by the error-logs page when sending credentials from the login form.
 */

export function getBasicAuthHeaders(
  credentials: { username: string; password: string } | null
): Record<string, string> {
  if (!credentials?.username || !credentials?.password) return {};
  return {
    Authorization: `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`,
  };
}
