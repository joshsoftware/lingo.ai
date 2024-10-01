"use client";
import { primaryFont } from "@/fonts";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Header = () => {
  const pathName = usePathname();
  return (
    <div
      className={cn(
        "fixed w-full flex justify-between items-center px-2 bg-[#1D1D1D] md:px-32 py-4",
        primaryFont.className
      )}
    >
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
            className="text-white hover:underline"
          >
            Take A Demo
          </Link>
        )}
        {pathName !== "/" && pathName !== "/transcriptions" && (
          <Link
            href={"/transcriptions"}
            className="text-white hover:underline"
          >
            View Records
          </Link>
        )}
      </div>
    </div>
  );
};

export default Header;
