import { Loader2Icon } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col w-full h-screen overflow-y-hidden justify-center items-center gap-4 pt-16 px-0 md:px-16">
      <div className="flex flex-col w-full justify-center items-center overflow-y-auto gap-4 p-8">
        <Loader2Icon className="w-8 h-8 animate-spin" />
      </div>
    </div>
  );
}
