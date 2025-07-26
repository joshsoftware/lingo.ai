"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import NavigateBack from "./NavigateBack";
import { cn } from "@/lib/utils";
import {
  LogOut,
  User,
  BotMessageSquare,
  Languages,
  Files,
  User2,
  Layers,
} from "lucide-react";
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
import ProfileInformation from "./ProfileInformation";
import { supportEmail } from "@/constants/homePage";

type NavItem = {
  label: string;
  href: string;
  type?: "link" | "anchor";
};

type NavigationProps = {
  isSignedIn?: boolean;
};

export type ProfileMenuItems = {
  icon: React.ReactElement<any, any>;
  label: string;
  onClick: () => void;
};
export type StateType = {
  popoverOpen: boolean;
  isModalOpen: boolean;
  isBotAdded: boolean;
  isProfileModalOpen: boolean;
  recordsLabel: string;
};
const Navigation = ({ isSignedIn }: NavigationProps) => {
  const pathname = usePathname() as string;
  const router = useRouter();
  const [uiState, setUIState] = useState<StateType>({
    popoverOpen: false,
    isModalOpen: false,
    isBotAdded: false,
    isProfileModalOpen: false,
    recordsLabel: "Sample Records",
  });

  const updateUIState = (updates: Partial<typeof uiState>) =>
    setUIState((prev) => ({ ...prev, ...updates }));

  useEffect(() => {
    const botAdded = Cookies.get("isBotAdded") === "true";
    updateUIState({
      isBotAdded: botAdded,
      recordsLabel: isSignedIn ? "View Records" : "Sample Records",
    });
    if (pathname === "/" && isSignedIn) {
      router.push("/new");
    }
  }, [isSignedIn]);
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
    enabled: false,
  });

  const toggleModal = (stateKey: keyof StateType) => {
    updateUIState({ [`${stateKey}`]: !uiState[stateKey] });
  };

  const handleLogout = async () => {
    try {
      await handleSignOut();
      updateUIState({
        isBotAdded: false,
        recordsLabel: "Sample Records",
      });
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const profileMenuItems: ProfileMenuItems[] = [
    {
      icon: <User2 className="h-[1.2rem] w-[1.2rem] mr-2" />,
      label: "Profile",
      onClick: () => {
        toggleModal("isProfileModalOpen");
      },
    },
    {
      icon: <BotMessageSquare className="h-[1.2rem] w-[1.2rem] mr-2" />,
      label: "Lingo bot",
      onClick: () => {
        toggleModal("isModalOpen");
      },
    },
    {
      icon: <Layers className="h-[1.2rem] w-[1.2rem] mr-2" />,
      label: "Upgrade plan",
      onClick: () => {
        const to = supportEmail;
        const subject = "Request to Upgrade My Lingo.ai Subscription Plan";
        const body = `Hello Lingo.ai Support Team,%0D%0A%0D%0AI would like to upgrade my current subscription plan. Please let me know the available options and the process to proceed.%0D%0A%0D%0AThank you,%0D%0A[Your Name]`;
        const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(
          subject
        )}&body=${body}`;
        window.location.href = mailtoLink;
      },
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
      }
    } catch (error) {
      console.error("Add Bot Error:", error);
    }
  };

  return (
    <>
      <nav className="top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
        <div className="mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-around">
          <div className="flex items-center justify-between w-full mb-4 md:mb-0">
            <div className="inline-flex w-[11%] ">
              {!["/", "/new"].includes(pathname) && <NavigateBack href="/" />}
            </div>

            <div className="flex justify-start items-center space-x-2 w-full ">
              <div className="w-8 h-8 min-w-8 min-h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg leading-none">
                  L
                </span>
              </div>
              <span className="text-xl font-bold whitespace-nowrap">
                Lingo.ai
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center space-x-8 w-full ">
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

          <div className="flex items-center justify-end space-x-4 w-full mr-20 ">
            {!isSignedIn && pathname !== "/signin" && (
              <Button
              variant="ghost"
              className="hidden md:inline-flex border hover:font-bold w-32"
              onClick={() => router.push("/signin")}
            >
              Sign In
            </Button>
            )}

            {isSignedIn && (
              <Button
                variant={"greenTheme"}
                className={`${pathname === "/new" ? "hidden" : ""}`}
              >
                <Link
                  href={"/new"}
                  className="flex justify-center items-center"
                >
                  <Languages className="mr-2 w-4 h-4" />
                  <span className="text-md">Translate</span>
                </Link>
              </Button>
            )}
            {pathname !== "/transcriptions" && (
              <Button variant={"greenTheme"}>
                <Files className="mr-2 w-4 h-4" />
                <Link href={"/transcriptions"}>{uiState.recordsLabel}</Link>
              </Button>
            )}

            {isSignedIn && pathname !== "/" && (
              <DropdownMenu>
                <DropdownMenuTrigger className="cursor-pointer" asChild>
                  <div
                    onClick={() =>
                      updateUIState({ popoverOpen: !uiState.popoverOpen })
                    }
                    className={cn(
                      "w-8 h-8 flex items-center justify-center border-[#668D7E] text-[#668D7E] rounded-full bg-white hover:text-white hover:bg-[#668D7E] cursor-pointer transition-all duration-200 hover:shadow-md border",
                      uiState.popoverOpen ? "shadow-lg" : ""
                    )}
                  >
                    <User size={16} />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent sideOffset={10} className="w-40">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {profileMenuItems.map(({ icon, label, onClick }, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={onClick}
                      className={`cursor-pointer hover:!text-black hover:font-bold hover:!bg-[#668D7E]/30`}
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
        isOpen={uiState.isProfileModalOpen}
        onClose={() => updateUIState({ isProfileModalOpen: false })}
        title="Profile"
      >
        <ProfileInformation />
      </Modal>
      <Modal
        isOpen={uiState.isModalOpen}
        onClose={() => updateUIState({ isModalOpen: false })}
        title="Meeting Recorder Bot"
      >
        {uiState.isBotAdded ? (
          <p>Meeting Recorder Bot is already added!</p>
        ) : (
          <>
            <p>Do you want to add a bot for meeting Summarization?</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => updateUIState({ isModalOpen: false })}
              >
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

export default Navigation;
