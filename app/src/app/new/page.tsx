import { validateRequest } from "@/auth";
import NavigateBack from "@/components/NavigateBack";
import RecorderCard from "@/components/RecorderCard";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Lingo.ai | New",
};

const page = async () => {
  const { user } = await validateRequest();

	if (!user) return redirect("/signin");

  return (
    <div className="flex flex-col w-full h-screen pt-16 px-0 md:px-16">
      <div className="flex justify-start w-full px-4 mt-8">
        <NavigateBack href="/" />
      </div>
      <div className="flex flex-1 justify-center items-center">
        <RecorderCard userId={user.id} />
      </div>
    </div>
  );
};

export default page;
