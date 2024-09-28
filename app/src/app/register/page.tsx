import NavigateBack from "@/components/NavigateBack";
import RegisterForm from "@/components/UserForm";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lingo.ai | Register",
};

const page = async () => {
  return (
    <div className="flex flex-col w-full h-screen pt-16 px-0 md:px-16">
      <div className="flex justify-start w-full px-4 mt-8">
        <NavigateBack />
      </div>
      <div className="flex flex-1 justify-center items-center">
        {/* <RegisterForm /> */}
      </div>
    </div>
  );
};

export default page;