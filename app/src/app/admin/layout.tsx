// app/admin/layout.tsx
import Link from "next/link";
import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await validateRequest();
  if (!user || user.role !== "ADMIN") redirect("/");

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-900 text-white p-4 space-y-4">
        <h1 className="text-xl font-bold">Admin</h1>
        <nav className="space-y-2">
          <Link href="/admin/users" className="block hover:underline">
            Users
          </Link>
          <Link href="/admin/subscriptions" className="block hover:underline">
            Subscriptions
          </Link>
          <Link href="/transcriptions" className="block hover:underline">
            Sample Recordings
          </Link>
        </nav>
      </aside>
      <main className="flex-1 bg-gray-50 p-6 overflow-auto">{children}</main>
    </div>
  );
}
