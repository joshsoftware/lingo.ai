import RecorderCard from "@/components/RecorderCard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lingo.ai | New",
};

const page = () => {
  return (
    <div className="flex flex-col h-screen md:flex-row w-full justify-center items-center gap-4 pt-16 px-0 md:px-16">
      <RecorderCard />
    </div>
  );
};

export default page;
