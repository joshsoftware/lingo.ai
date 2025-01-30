"use client";
import { primaryFont, tertiaryFont } from "@/fonts";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "./ui/button";

const Header = () => {
  const pathName = usePathname();
  return (
    <header
      className={cn(
        "flex justify-between items-center bg-[#1D1D1D]",
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
        {pathName !== "/" && pathName !== "/new" && (
          <Link
            href={"/new"}
            className={cn(
              buttonVariants({
                className: "!bg-[#668D7E] !hover:bg-[#668D7E] text-white text-xs px-3",
                size: 'xs'
              }),
            tertiaryFont.className
            )}
          >
            Demo
          </Link>
        )}
        {pathName !== "/" && pathName !== "/transcriptions" && (
          <Link
            href={"/transcriptions"}
            className={cn(
              buttonVariants({
                className: "!bg-[#668D7E] !hover:bg-[#668D7E] text-white text-xs px-3",
                size: 'xs'
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
