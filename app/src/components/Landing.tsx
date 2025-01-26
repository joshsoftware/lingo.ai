import { primaryFont } from "@/fonts";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { buttonVariants } from "./ui/button";
import Link from "next/link";
import { User } from "lucia";
import { Messages } from "@/constants/messages";

const Landing = (attr: {user: User | null}) => {

  return (
    <div className="flex flex-col md:flex-row w-full h-full justify-between gap-4 pt-16">
      <div className="w-full flex flex-col gap-4 justify-center items-start">
        <h1 className={cn(primaryFont.className, "text-3xl text-[#8CB369] ")}>
          Welcome
        </h1>
        <h1 className={cn(primaryFont.className, "text-5xl")}>
          {Messages.LANDING_PAGE_TITLE}
        </h1>
        <p>  
          {Messages.LANDING_PAGE_DESCRIPTION}
        </p>
         <div className="w-full flex gap-3">
        <Link
          href={attr?.user?.role == "hr" ? "/analyse" : "/record"}
          className={buttonVariants({
            className: "!bg-[#668D7E] !hover:bg-[#668D7E] text-white",
          })}
        >
          Try Now
        </Link>

        <Link
          href={attr?.user?.role == "hr" ? "/analysis" : "/transcriptions"}
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
