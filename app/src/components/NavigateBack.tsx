"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { ArrowLeftIcon } from "lucide-react";

interface NavigateBackProps {
  href?: string;
}

const NavigateBack = (props: NavigateBackProps) => {
  const { href } = props;
  const router = useRouter();
  const pathname = usePathname();
  const handleBack = () => {
    if (pathname.startsWith("/transcriptions/")) {
      router.push("/transcriptions");
    } else if (pathname.startsWith("/crm/")) {
      router.push("/crm");
    } else {
      href ? router.push(href) : router.back();
    }
  };

  return (
    <div className="flex max-sm:flex-col justify-between max-sm:items-start items-center w-full max-sm:gap-2">
      <Button className="flex gap-4" variant={"ghost"} onClick={handleBack}>
        <ArrowLeftIcon className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default NavigateBack;
