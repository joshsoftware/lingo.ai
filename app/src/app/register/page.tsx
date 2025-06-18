import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Lingo.ai | Register",
};
const page = async () => {
  return (
    <div className="flex flex-col w-full pt-8">
      <div className="flex flex-1 justify-center items-center">
        {/* <RegisterForm /> */}
      </div>
    </div>
  );
};

export default page;
