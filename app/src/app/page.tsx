import { auth, signOut } from "@/auth";
import LogoutButton from "@/components/Logout";
import { ThemeToggle } from "@/components/ThemeToggle";
import UploadFile from "@/components/UploadFile";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session) {
    return redirect("/sign-in");
  }

  return (
    <div className="flex flex-col items-center justify-between p-24">
      <div className="flex gap-4 items-center">
        Toggle Theme <ThemeToggle />
      </div>
      <div className="flex flex-col gap-4 items-center">
        <h1 className="text-4xl font-bold text-center">
          Hello {session.user.name}!
        </h1>
        <LogoutButton
          signOut={async () => {
            "use server";
            await signOut();
          }}
        />
          <UploadFile />
      </div>
    </div>
  );
}
