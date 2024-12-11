import { validateRequest } from "@/auth";
import AiCruitFrom from "@/components/AiCruitForm";
import NavigateBack from "@/components/NavigateBack";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Lingo.ai | New",
};

const page = async () => {
  const { user } = await validateRequest();
  if (!user) return redirect("/signin");
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
