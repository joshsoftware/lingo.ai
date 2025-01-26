'use client'

import { primaryFont, tertiaryFont } from "@/fonts";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "./ui/button";
import { HeaderProps } from "@/types/app";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

const Header = ({ user }: HeaderProps) => {
  const router = useRouter();
  const pathName = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "GET" });
      setIsLoggingOut(true);
      toast.success("Logged out successfully!");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header
      className={cn(
        "flex justify-between items-center bg-[#1D1D1D] sticky top-0",
        primaryFont.className
      )}
    >
      <div className="container flex items-center py-3">
        <Link href={"/"} className="text-3xl text-white">
          LingoAI
        </Link>
        <div className="flex justify-center items-center w-full">
          <Image
            src={"/JoshLogo.svg"}
            className="self-center"
            width={131}
            height={100}
            alt="Josh Logo"
          />
        </div>
        <div className="flex gap-2 min-w-fit justify-end">
          {pathName !== "/" &&
            pathName !== "/analyse" &&
            pathName !== "/record" && (
              <Link
                href={user?.role === "hr" ? "/analyse" : "/record"}
                className={cn(
                  buttonVariants({
                    className:
                      "!bg-[#668D7E] !hover:bg-[#668D7E] text-white text-xs px-3",
                    size: "xs",
                  }),
                  tertiaryFont.className
                )}
              >
                + New
              </Link>
            )}
          {pathName !== "/" &&
            pathName !== "/analysis" &&
            pathName !== "/transcriptions" && (
              <Link
                href={user?.role === "hr" ? "/analysis" : "/transcriptions"}
                className={cn(
                  buttonVariants({
                    className:
                      "!bg-[#668D7E] !hover:bg-[#668D7E] text-white text-xs px-3",
                    size: "xs",
                  }),
                  tertiaryFont.className
                )}
              >
                View Records
              </Link>
            )}
          {
            user && <button
            onClick={handleLogout}
            className={cn(
              buttonVariants({
                className: "!bg-red-600 !hover:bg-red-700 text-white text-xs px-3",
                size: "xs",
              }),
              tertiaryFont.className
            )}
          >
            <LogOut className="inline-block mr-2" />
            Logout
          </button>
          }
        </div>
      </div>
    </header>
  );
};

export default Header;
