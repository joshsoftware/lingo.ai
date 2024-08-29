import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col gap-4 items-center">
        <h1 className="text-4xl font-bold text-center">
          Hello Nextjs
        </h1>
        <div className="flex gap-4 items-center">
          Toggle Theme <ThemeToggle />
        </div>
      </div>
    </main>
  );
}
