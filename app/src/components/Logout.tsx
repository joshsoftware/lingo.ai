"use client";

import { ExitIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";

interface LogoutButtonProps {
  signOut: () => void;
}

const LogoutButton = (props: LogoutButtonProps) => {
  const { signOut } = props;
  return (
    <Button onClick={() => signOut()} className="flex gap-2 justify-center items-center">
      <ExitIcon/>
      Logout
    </Button>
  );
};

export default LogoutButton;
