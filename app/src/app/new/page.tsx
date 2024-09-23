import NavigateBack from "@/components/NavigateBack";
import RecorderCard from "@/components/RecorderCard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lingo.ai | New",
};

const page = () => {
  return (
    <div className="flex flex-col w-full h-screen pt-16 px-0 md:px-16">
      <div className="flex justify-start w-full px-4 mt-8">
        <NavigateBack href="/" />
      </div>
      <div className="flex flex-1 justify-center items-center">
        <RecorderCard />
      </div>
    </div>
  );
};

export default page;
