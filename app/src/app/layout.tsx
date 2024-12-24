import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import TanstackQueryProvider from "@/providers/TanstackQueryProvider";
import { secondaryFont } from "@/fonts";
import Header from "@/components/Header";
import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import { User } from "lucia";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Lingo.ai"
};

/**
 * This method checks if the user is allowed to access the current requested page
 * @param user logged in user
 * @returns {Promise<boolean>} true if allowed and false if not
 */
async function accessAllowed(user: User | null): Promise<boolean> {
  const headerList = headers();
  const pathSegments = headerList.get("x-current-path")?.split("/") ?? []
  const path = pathSegments.length > 1 ? `/${pathSegments[1]}` : "/"

  switch(path) {
    // Allowed regardless of user logged in or not
    case "":
    case "/":
      return true

    // Allowed when user is not logged in
    case "/signin":
    case "/signup":
      return !user

    // Allowed when user is logged in
    case "/transcriptions":
    case "/record":
      return !!user
    
    // Allowed when user is logged in and has role 'hr'
    case "/analysis":
    case "/analyse":
      return user?.role === "hr"

    // Denied in all other cases
    default:
      return false
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const { user } = await validateRequest();

  if(!await accessAllowed(user)) {
    if (user) {
      return redirect("/")
    } else {
      return redirect("/signin")
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`flex flex-col overflow-y-auto ${secondaryFont.className}`}
      >
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
