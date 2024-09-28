"use client";

import { tertiaryFont } from "@/fonts";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
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


  const onSubmit = (data: RegisterUserRequest) => {
    if (formType === "signup")
      signupUser(data)
    else
      //  console.log("Signin User")
      signinUser(data)
  };

  return (
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
                  <Input {...field} placeholder="Enter your Pasword" />
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
  );
};

export default UserForm;