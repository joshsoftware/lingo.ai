import { primaryFont } from "@/fonts";
import { cn } from "@/lib/utils";
import { FileIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button, buttonVariants } from "./ui/button";

const Header = () => {
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
      <div className="flex gap-2 w-full justify-end">
      <Link
        href={"/new"}
        className="text-white hover:underline"
        // className={cn(
        //   buttonVariants({
        //     className: "text-white text-xs w-full text-nowrap ",
        //   })
        // )}
      >
        Take A Demo
      </Link>
      <Link
        href={"/transcriptions"}
        className="text-white hover:underline"
        // className={cn(
        //   buttonVariants({
        //     className: "text-white text-xs w-full text-nowrap ",
        //   })
        // )}
      >
              View Records

      </Link>
      </div>

    </div>
  );
};

export default Header;
