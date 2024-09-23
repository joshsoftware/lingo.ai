"use client";

import { primaryFont } from "@/fonts";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button, buttonVariants } from "./ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

const Landing = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col md:flex-row w-full h-full justify-between items-center gap-4 pt-16 px-0 md:px-16">
      <div className="w-full flex flex-col gap-4 justify-center items-start">
        <h1 className={cn(primaryFont.className, "text-3xl text-[#8CB369] ")}>
          Welcome
        </h1>
        <h1 className={cn(primaryFont.className, "text-5xl")}>
          Speak, Translate & Summarise
        </h1>
        <p>
          Translate and summarize content from multiple languages into English
          with ease.
        </p>
        <Link
          href={"/register"}
          className={buttonVariants({
            className: "!bg-[#668D7E] !hover:bg-[#668D7E] text-white",
          })}
        >
          Take A Demo
        </Link>
      </div>
      <Image
        src={"/landingFrame.svg"}
        className="self-center"
        width={500}
        height={538}
        alt="Josh Logo"
      />
    </div>
  );
};

export default Landing;
