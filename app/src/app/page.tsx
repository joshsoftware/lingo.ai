"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isSignedIn } from "@/actions/auth";
import Landing from "@/components/Landing";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const isUserSignedIn = await isSignedIn();
      if (isUserSignedIn) {
        router.push("/new");
      }
    };
    checkAuth();
  }, [router]);

  return (
    <div className="flex w-full flex-col">
      <Landing />
    </div>
  );
}
