"use client";

import { ExitIcon } from "@radix-ui/react-icons";

interface LogoutButtonProps {
  signOut: () => void;
}

const LogoutButton = (props: LogoutButtonProps) => {
  const { signOut } = props;
  return (
    <div className="flex gap-2 justify-center items-center">
      <ExitIcon onClick={() => signOut()} />
      Logout
    </div>
  );
};

export default LogoutButton;
