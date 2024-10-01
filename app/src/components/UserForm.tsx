"use client";

import { tertiaryFont } from "@/fonts";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Button, buttonVariants } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { RegisterUserRequest, registerUserSchema } from "@/Validators/register";

import { useUser } from "@/hooks/useUser";
import Link from "next/link";

interface UserFormProps {
  formType: "signin" | "signup";
}

const UserForm = (props: UserFormProps) => {

  const { formType } = props;

  const { disableSubmit, isPending, signupUser, signinUser } = useUser();

  const form = useForm<RegisterUserRequest>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      password: "",
      userEmail: "",
    },
    mode: "all",
  });

  const onSubmit = (data: RegisterUserRequest) => formType === "signup" ? signupUser(data) : signinUser(data);

  return (
    <div className="flex flex-col gap-2 w-full justify-center items-center">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full max-w-sm flex flex-col gap-4 justify-center items-center"
        >
          <h1 className={cn(tertiaryFont.className, "text-3xl font-bold")}>
            {
              formType === "signup" ? "Sign Up" : "Sign In"
            }
          </h1>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <FormField
              control={form.control}
              name="userEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter your Email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Enter your Pasword" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button
            isLoading={disableSubmit || isPending}
            disabled={disableSubmit || isPending}
            type="submit"
            className="bg-[#668D7E] hover:bg-[#668D7E] text-white w-full"
          >
            {
              formType === "signup" ? "Sign Up" : "Sign In"
            }
          </Button>
        </form>
      </Form>
      <div>
        <div className="flex flex-col text-xs gap-1 justify-center items-center">
          <h1>{formType === "signup" ? "Already have an account?" : "Please send an email to access the demo:"}</h1>
          <h1>info@joshsoftware.com</h1>
        </div>
        {/* {formType === "signup" ? "Already have an account?" : "To request access, please send an email to:"} */}
        {/* <Link
          href={formType === "signup" ? "/signin" : "/signup"}
          aria-disabled={disableSubmit || isPending}
          className={cn(
            disableSubmit || isPending ? 'pointer-events-none' : '',
            buttonVariants({
              variant: "link",
              className: "text-[#668D7E] hover:text-[#668D7E] font-bold"
            }
            ))}
        >
          {formType === "signup" ? "Sign In" : ""}
        </Link> */}
      </div>
    </div>
  );
};

export default UserForm;