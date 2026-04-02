import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Lingo.ai",
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
