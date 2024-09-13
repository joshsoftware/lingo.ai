import { primaryFont } from "@/fonts";
import { cn } from "@/lib/utils";
import { FileIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Header = () => {
  return (
    <div
      className={cn(
        "fixed w-full flex justify-between items-center bg-[#1D1D1D] px-8 py-4",
        primaryFont.className,
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
      <Link href={"/transcriptions"} className="text-3xl text-white">
        <FileIcon className="w-6 h-6" />
      </Link>
    </div>
  );
};

export default Header;
