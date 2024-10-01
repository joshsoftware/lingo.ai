import NavigateBack from "@/components/NavigateBack";
import RegisterForm from "@/components/UserForm";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lingo.ai | Register",
};

const page = async () => {
  return (
    <div className="flex flex-col w-full pt-8">
      <div className="flex justify-start w-full mb-8">
        <NavigateBack />
      </div>
      <div className="flex flex-1 justify-center items-center">
        {/* <RegisterForm /> */}
      </div>
    </div>
  );
};

export default page;