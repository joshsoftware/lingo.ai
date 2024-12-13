import AiCruitFrom from "@/components/AiCruitForm";
import NavigateBack from "@/components/NavigateBack";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lingo.ai | New",
};

const page = async () => {
  return (
    <div className="flex flex-col w-full pt-8">
      <div className="flex justify-start w-full mb-8">
        <NavigateBack href="/" />
      </div>
      <div className="flex flex-1 justify-center items-start">
        <AiCruitFrom />
      </div>
    </div>
  );
};

export default page;
