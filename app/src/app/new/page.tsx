import { validateRequest } from "@/auth";
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
    <div className="flex flex-col w-full pt-8">
      <div className="flex flex-1 justify-center items-start">
        <RecorderCard userId={user.id} />
      </div>
    </div>
  );
};

export default page;
