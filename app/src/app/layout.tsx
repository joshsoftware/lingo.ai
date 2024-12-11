import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import TanstackQueryProvider from "@/providers/TanstackQueryProvider";
import { secondaryFont } from "@/fonts";
import Header from "@/components/Header";
import { validateRequest } from "@/auth";

export const metadata: Metadata = {
  title: "Lingo.ai",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const { user } = await validateRequest();

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`h-screen flex flex-col overflow-y-auto ${secondaryFont.className}`}>
        <TanstackQueryProvider>
          <Header user={user} />
          <section className="flex-1 overflow-y-auto">
            <div className="container h-full">{children}</div>
          </section>
          <Toaster richColors closeButton />
        </TanstackQueryProvider>
      </body>
    </html>
  );
}
