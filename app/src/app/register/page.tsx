import RegisterForm from "@/components/RegisterForm";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lingo.ai | Register",
};

const page = async () => {
  return (
    <div className="flex flex-col md:flex-row w-full h-screen justify-center items-center gap-4 pt-16 px-0 md:px-16">
      <RegisterForm />
    </div>
  );
};

export default page;
