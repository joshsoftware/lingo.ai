"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { BotIcon, User, LogOut } from "lucide-react";

import { primaryFont, tertiaryFont } from "@/fonts";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button, buttonVariants } from "./ui/button";
import { Modal } from "./ui/modal";
import { handleSignOut, isSignedIn } from "@/actions/auth";
import Cookies from "js-cookie";
import { Popover } from "./ui/popover";

type HeaderProps = {
  isSignedIn: boolean;
};

const Header = ({ isSignedIn }: HeaderProps) => {
  const router = useRouter();

  const [isBotAdded, setIsBotAdded] = useState(false);

  useEffect(() => {
    // Read the isBotAdded cookie when the component mounts
    const botAdded = Cookies.get("isBotAdded") === "true"; // Cookies store the flag as a string
    setIsBotAdded(botAdded);
  }, []);

  const pathName = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const {
    refetch: fetchAuthLink,
    data: authData,
    isFetching,
  } = useQuery({
    queryKey: ["google-auth"],
    queryFn: async () => {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_URL}/auth/google`
      );
      return response.data;
    },
    enabled: false, // disable auto-fetch
  });

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleAddBot = async () => {
    try {
      const { data } = await fetchAuthLink();

      if (data?.auth_url) {
        window.location.href = data.auth_url;
      } else {
        console.log("Authorization URL not found");
      }
    } catch (error) {
      console.error("Add Bot Error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await handleSignOut();
      router.push("/signin");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };


  return (
    <>
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
            {pathName !== "/" && pathName !== "/new" && isSignedIn && (
              <Link
                href={"/new"}
                className={cn(
                  buttonVariants({
                    className:
                      "!bg-[#668D7E] !hover:bg-[#668D7E] text-white text-xs px-3",
                    size: "xs",
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
            {isSignedIn && (
              <Button
                className={cn(
                  buttonVariants({
                    className:
                      "!bg-[#668D7E] !hover:bg-[#668D7E] text-white text-xs px-3",
                    size: "xs",
                  }),
                  tertiaryFont.className
                )}
                onClick={toggleModal}
              >
                <BotIcon />
              </Button>
            )}
            {isSignedIn && (
              <Popover
                isOpen={popoverOpen}
                onClose={() => setPopoverOpen(false)}
                trigger={
                  <div
                    onClick={() => setPopoverOpen(!popoverOpen)}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-full bg-white  cursor-pointer transition-all duration-200 hover:shadow-md border",
                      popoverOpen ? "shadow-lg" : ""
                    )}
                  >
                    <User className="text-black" size={16} />
                  </div>
                }
              >
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className={cn(
                    "text-xs flex w-full items-center",
                    tertiaryFont.className
                  )}
                >
                  <LogOut className="mr-1" size={16} />
                  Logout
                </Button>
              </Popover>
            )}
          </div>
        </div>
      </header>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Meeting Recorder Bot"
      >
        {isBotAdded ? (
          <>
            <p>Meeting Recorder Bot is already added !</p>
          </>
        ) : (
          <>
            <p>Do you want to add a bot for meeting Summarization?</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                className={cn(
                  buttonVariants({
                    className:
                      "!bg-[#668D7E] !hover:bg-[#668D7E] text-white text-xs px-3",
                    size: "xs",
                  }),
                  tertiaryFont.className
                )}
                onClick={handleAddBot}
              >
                Add Bot
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
};

export default Header;
