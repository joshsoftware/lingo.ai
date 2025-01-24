import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();
  cookieStore.delete('auth_session');

  return new Response(null, { status: 200 });
}
