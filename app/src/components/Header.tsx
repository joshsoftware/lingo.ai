"use client";
import Navigation from "./Navigation";

type HeaderProps = {
  isSignedIn: boolean;
};

const Header = ({ isSignedIn }: HeaderProps) => {
  return (
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
  );
};

export default Header;
