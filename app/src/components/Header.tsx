"use client";
import Navigation from "./Navigation";

type HeaderProps = {
  isSignedIn: boolean;
  userRole: string;
};

const Header = ({ isSignedIn, userRole }: HeaderProps) => {
  return (
    <Navigation
      isSignedIn={isSignedIn}
      userRole={userRole}
      {...(!isSignedIn && {
        navItems: [
          { label: "Features", href: "#features" },
          { label: "Use Cases", href: "#use-cases" },
          { label: "Pricing", href: "#pricing" },
        ],
      })}
    />
  );
};

export default Header;
