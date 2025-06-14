"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { redirect, usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import NavigateBack from "./NavigateBack";
import { cn } from "@/lib/utils";
// import { Popover } from "@/components/ui/popover";
import { LogOut, User, BotMessageSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Cookies from "js-cookie";
import { handleSignOut } from "@/actions/auth";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Modal } from "./ui/modal";
type NavItem = {
  label: string;
  href: string;
  type?: "link" | "anchor"; // default to "anchor"
};

type NavigationProps = {
  isSignedIn?: boolean;
};
export type ProfileMenuItems = {
  icon: React.ReactElement<any, any>;
  label: string;
  onClick: () => void;
};
const Navigation = ({ isSignedIn }: NavigationProps) => {
  const pathname = usePathname() as string;
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBotAdded, setIsBotAdded] = useState(false);
  useEffect(() => {
    // Read the isBotAdded cookie when the component mounts
    const botAdded = Cookies.get("isBotAdded") === "true"; // Cookies store the flag as a string
    setIsBotAdded(botAdded);
  }, []);
  const router = useRouter();
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
  const handleLogout = async () => {
    try {
      await handleSignOut();
      // redirect("/");
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  const profileMenuItems: ProfileMenuItems[] = [
    {
      icon: <BotMessageSquare className="h-[1.2rem] w-[1.2rem] mr-2" />,
      label: "Lingo.ai",
      onClick: toggleModal,
    },
    {
      icon: <LogOut className="h-[1.2rem] w-[1.2rem] mr-2" />,
      label: "Logout",
      onClick: handleLogout,
    },
  ];
  const navItems: NavItem[] | undefined = useMemo(() => {
    if (pathname === "/") {
      return [
        { label: "Features", href: "#features" },
        { label: "Use Cases", href: "#use-cases" },
        { label: "Pricing", href: "#pricing" },
      ];
    }
    return undefined;
  }, [pathname]);
  const handleAddBot = async () => {
    try {
      const { data } = await fetchAuthLink();
      if (data?.auth_url) {
        window.location.href = data.auth_url;
      } else {
      }
    } catch (error) {
      console.error("Add Bot Error:", error);
    }
  };
  return (
    <>
      <nav className="top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
        <div className="container  mx-auto px-4 py-4 flex items-center justify-between ">
          {!["/", "/new"].includes(pathname) && (
            <div className="absolute left-6">
              <NavigateBack href="/" />
            </div>
          )}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                L
              </span>
            </div>
            <span className="text-xl font-bold">Lingo.ai</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navItems &&
              navItems.map((item, i) =>
                item.type === "link" ? (
                  <Link
                    key={i}
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={i}
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </a>
                )
              )}
          </div>
          <div className="flex items-center space-x-4 ">
            {!isSignedIn && pathname !== "/signin" && (
              <Link href={"/signin"}>
                <Button variant="ghost" className="hidden md:inline-flex">
                  Sign In
                </Button>
              </Link>
            )}
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href={"/transcriptions"}>
              Sample Records
            </Link>
            </Button>

            {isSignedIn && pathname !== "/" && (
              <DropdownMenu>
                <DropdownMenuTrigger className="cursor-pointer" asChild>
                  <div
                    onClick={() => setPopoverOpen(!popoverOpen)}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-full bg-white  cursor-pointer transition-all duration-200 hover:shadow-md border",
                      popoverOpen ? "shadow-lg" : ""
                    )}
                  >
                    <User className="text-black" size={16} />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent sideOffset={10}>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {profileMenuItems.map(({ icon, label, onClick }, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={onClick}
                      className="cursor-pointer"
                      // variant={`${
                      //   label === "Logout" ? "destructive" : "default"
                      // }`}
                    >
                      {icon}
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </nav>
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
                  // tertiaryFont.className
                )}
                onClick={() => {
                  handleAddBot();
                }}
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

export default Navigation;
