import { Loader2Icon } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col w-full h-full overflow-y-hidden justify-center items-center">
      <div className="flex flex-col w-full justify-center items-center overflow-y-auto">
        <Loader2Icon className="w-8 h-8 animate-spin" />
      </div>
    </div>
  );
}
