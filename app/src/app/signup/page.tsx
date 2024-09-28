import { validateRequest } from "@/auth";
import NavigateBack from "@/components/NavigateBack";
import UserForm from "@/components/UserForm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;


export default async function Page() {

    const { user } = await validateRequest();
    if (user) return redirect("/new");

	return (
        <div className="flex flex-col w-full h-screen pt-16 px-0 md:px-16">
        <div className="flex justify-start w-full px-4 mt-8">
          <NavigateBack />
        </div>
        <div className="flex flex-1 justify-center items-center">
          <UserForm formType="signup" />
        </div>
      </div>
	);
}
