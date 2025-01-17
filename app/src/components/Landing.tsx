"use client";

import { primaryFont } from "@/fonts";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { buttonVariants } from "./ui/button";
import Link from "next/link";
import { ValidationMessage } from "@/constants/messages";

const Landing = () => {
  return (
    <div className="flex flex-col md:flex-row w-full h-full justify-between gap-4 pt-16">
      <div className="w-full flex flex-col gap-4 justify-center items-start">
        <h1 className={cn(primaryFont.className, "text-3xl text-[#8CB369] ")}>
          Welcome
        </h1>
        <h1 className={cn(primaryFont.className, "text-5xl")}>
          {ValidationMessage.LANDING_PAGE_TITLE}
        </h1>
        <p>{ValidationMessage.LANDINF_PAGE_DESCRIPTION}</p>
        <div className="w-full flex gap-3">
          <Link
            href={"/new"}
            className={buttonVariants({
              className: "!bg-[#668D7E] !hover:bg-[#668D7E] text-white",
            })}
          >
            Try Now
          </Link>

          <Link
            href={"/transcriptions"}
            className={buttonVariants({
              className: "!bg-[#668D7E] !hover:bg-[#668D7E] text-white",
            })}
          >
            View Records
          </Link>
        </div>
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
