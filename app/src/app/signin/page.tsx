import NavigateBack from "@/components/NavigateBack";
import UserForm from "@/components/UserForm";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;


export default async function Page() {
	return (
        <div className="flex flex-col w-full pt-8">
        <div className="flex justify-start w-full mb-8">
          <NavigateBack />
        </div>
        <div className="flex flex-1 justify-center items-center">
          <UserForm formType="signin" />
        </div>
      </div>
	);
}
