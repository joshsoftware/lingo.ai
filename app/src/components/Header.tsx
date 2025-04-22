"use client";
import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { BotIcon } from "lucide-react";

import { primaryFont, tertiaryFont } from "@/fonts";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button, buttonVariants } from "./ui/button";
import { Modal } from "./ui/modal";

const Header = () => {
  // TODO: this flag will come from backend
  const isBotAdded = false;

  const pathName = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const {
    refetch: fetchAuthLink,
    data: authData,
    isFetching,
  } = useQuery({
    queryKey: ["google-auth"],
    queryFn: async () => {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BOT_URL}/google/auth`
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

      if (data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        console.log("Authorization URL not found");
      }
    } catch (error) {
      console.error("Add Bot Error:", error);
    }
  };

  const handleLogout = () => {
    debugger;
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    router.push("/");
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
            {pathName !== "/" && pathName !== "/new" && (
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
            <Button
              className={cn(
                buttonVariants({
                  className:
                    "!bg-[#ff0000] !hover:bg-[#668D7E] text-white text-xs px-3",
                  size: "xs",
                }),
                tertiaryFont.className
              )}
              onClick={handleLogout}
            >
              Logout
            </Button>
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
