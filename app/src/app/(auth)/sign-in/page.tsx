import { signIn } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import UserAuthForm from "@/components/UserAuthForm";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import Link from "next/link";

export default function page() {
    return (
        <div className="absolute inset-0">
            <div className="h-full max-w-2xl mx-auto flex flex-col items-center justify-center gap-4">
                <div className="container mx-auto flex w-full justify-center space-y-6 sm:w-[400px]">
                    <div className="flex flex-col space-y-2 text-center ">
                        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
                        <p className="text-sm max-w-xs mx-auto">
                            by continuing you agree to our terms and privacy policy.
                        </p>
                        <UserAuthForm
                            signIn={async () => {
                                "use server";
                                await signIn("github", {
                                    redirectTo: '/'
                                })
                            }}
                            providerType="github"
                        />
                    </div>
                </div>
                <Link
                    href={'/'}
                    className={cn(
                        buttonVariants({ variant: "secondary" }),
                        'self-center  gap-2'
                    )}>
                    <ArrowLeftIcon className="w-4 h-4" />Home
                </Link>
            </div>
        </div>
    )
}