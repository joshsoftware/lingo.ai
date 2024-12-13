import { validateRequest } from "@/auth";
import Landing from "@/components/Landing";

export default async function Home() {
  const { user } = await validateRequest();
  
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <Landing user={user} />
    </div>
  );
}
