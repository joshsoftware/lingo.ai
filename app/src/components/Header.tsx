'use client'

import { primaryFont, tertiaryFont } from "@/fonts";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "./ui/button";
import { User } from "lucia";

interface HeaderProps {
  user: User | null;
}

const Header = ({ user }: HeaderProps) => {
  const pathName = usePathname();
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
        </div>
      </div>
    </header>
  );
};

export default Header;
