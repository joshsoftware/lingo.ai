import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import TanstackQueryProvider from "@/providers/TanstackQueryProvider";
import { secondaryFont } from "@/fonts";
import { CookiesProvider } from "next-client-cookies/server";
import Header from "@/components/Header";
import { isSignedIn } from "@/actions/auth";

export const metadata: Metadata = {
  title: "Lingo.ai",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isUserSignedIn = await isSignedIn();

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`h-screen flex flex-col overflow-y-auto ${secondaryFont.className}`}
      >
        <CookiesProvider>
          <TanstackQueryProvider>
            <Header isSignedIn={isUserSignedIn} />
            <section className="flex-1 overflow-y-auto">
              <div className="container h-full">{children}</div>
            </section>
            <Toaster richColors closeButton />
          </TanstackQueryProvider>
        </CookiesProvider>
      </body>
    </html>
  );
}
