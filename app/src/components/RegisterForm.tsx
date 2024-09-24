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
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const RegisterForm = () => {
  const router = useRouter();
  const [isPersistingUser,setIsPersistingUser] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("user")) {
      router.push("/new");
    }
  }, [router]);

  const form = useForm<RegisterUserRequest>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      userName: "",
      userEmail: "",
    },
    mode: "all",
  });

  const { mutate, isPending } = useMutation({
    mutationKey: ["registerUser"],
    mutationFn: async (payload: RegisterUserRequest) => {
      const response = await axios.post("/api/register", payload);
      return response.data;
    },
    onSuccess: async (res) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(res));
      }
      form.reset();
      router.push("/new");
      setIsPersistingUser(false);
    },
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 422) {
          return toast.error("Failed to Register User", {
            description: error.message,
          });
        }
      }
      return toast.error(
        "Failed to Register User, please try again in some time",
      );
    },
  });

  const onSubmit = (data: RegisterUserRequest) => {
    setIsPersistingUser(true);
    mutate(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-sm flex flex-col gap-4 justify-center items-center"
      >
        <h1 className={cn(tertiaryFont.className, "text-3xl font-bold")}>
          Register
        </h1>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <FormField
            control={form.control}
            name="userName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter your Name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
        <Button
          isLoading={isPersistingUser || isPending}
          disabled={isPersistingUser || isPending}
          type="submit"
          className="bg-[#668D7E] hover:bg-[#668D7E] text-white w-full"
        >
          Register Now
        </Button>
      </form>
    </Form>
  );
};

export default RegisterForm;