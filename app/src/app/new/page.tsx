import { validateRequest } from "@/auth";
import AiCruitFrom from "@/components/AiCruitForm";
import NavigateBack from "@/components/NavigateBack";
import RecorderCard from "@/components/RecorderCard";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Lingo.ai | New",
};

const page = async () => {
  const { user } = await validateRequest();
  console.log("User that we are getting on land page : ", user);
  debugger;
  if (!user) return redirect("/signin");
  console.log("User that we are getting on land page : ", user);
  return (
    <div className="flex flex-col w-full pt-8">
      <div className="flex justify-start w-full mb-8">
        <NavigateBack href="/" />
      </div>
      {user.role == "hr" ? (
        <div className="flex flex-1 justify-center items-start">
          <AiCruitFrom />
        </div>
      ) : (
        <div className="flex flex-1 justify-center items-start">
          <RecorderCard userId={user} />
        </div>
      )}
    </div>
  );
};

export default page;
