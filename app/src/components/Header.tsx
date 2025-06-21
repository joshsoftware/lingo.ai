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
import Navigation from "./Navigation";

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
      <Navigation
        isSignedIn={isSignedIn}
        {...(!isSignedIn && {
          navItems: [
            { label: "Features", href: "#features" },
            { label: "Use Cases", href: "#use-cases" },
            { label: "Pricing", href: "#pricing" },
          ],
        })}
      />
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
                  })
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
