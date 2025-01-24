import { validateRequest } from "@/auth";
import NavigateBack from "@/components/NavigateBack";
import RecorderCard from "@/components/RecorderCard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lingo.ai | Record",
};

const page = async () => {
  const { user } = await validateRequest();
  const userID = user?.id ? user.id : "";
  
  return (
    <div className="flex flex-col w-full pt-8">
      <div className="flex justify-start w-full mb-8">
        <NavigateBack href="/" />
      </div>
      <div className="flex flex-1 justify-center items-start">
        <RecorderCard userId={userID} />
      </div>
    </div>
  );
};

export default page;
