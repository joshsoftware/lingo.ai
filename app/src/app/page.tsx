import { auth, signOut } from "@/auth";

import LogoutButton from "@/components/Logout";
import { ThemeToggle } from "@/components/ThemeToggle";
import { redirect } from "next/navigation";

import { BackgroundBeams } from "@/components/BackgroundBeams";
import { AudioRecorder } from "@/components/AudioRecorder";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export default async function Home() {
  const session = await auth();

  if (!session) {
    return redirect("/sign-in");
  }

  return (
    <div className="flex flex-col items-center justify-between p-24">
      <div className="z-10 flex gap-4 items-center">
        Toggle Theme <ThemeToggle />
      </div>
      <div className="z-10 flex flex-col gap-4 items-center">
        <h1 className="text-4xl font-bold text-center">
          Hello {session.user.name}!
        </h1>
        <LogoutButton
          signOut={async () => {
            "use server";
            await signOut();
          }}
        />
        <Card>
          <CardHeader className="flex flex-col justify-center items-center gap-2">
            <h1 className="font-bold text-3xl">
              Lets hear what you have to say ...
            </h1>
            <p className="text-md">
              Upload or record an audio to get started
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex w-full items-center justify-center">
              <AudioRecorder />
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs font-extralight">
              * By uploading or recording audio you agree to our terms and conditions
            </p>
          </CardFooter>
        </Card>
      </div>
      <BackgroundBeams />
    </div>
  );
}
