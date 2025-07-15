"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle } from 'lucide-react';
import { forgotPasswordSchema, ForgotPasswordRequest } from "@/Validators/resetPassword";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { userEmail: "" },
    mode: "all",
  });

  const handleSubmit = async (data: ForgotPasswordRequest) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.userEmail }),
      });
      if (res.status === 404) {
        toast.error("Email not found. Please sign up first.");
        setTimeout(() => router.push("/signup"), 2000);
        return;
      }
      if (!res.ok) throw new Error("Failed to send reset link");
      toast.success("A reset link has been sent to your email.");
      setTimeout(() => router.push("/signin"), 2000);
    } catch (err) {
      form.setError("userEmail", { message: "Something went wrong. Please try again later." });
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-[#668D7E]">Forgot Password?</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="userEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="Enter your email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="bg-[#668D7E] hover:bg-[#557364] text-white font-bold py-2 px-4 rounded"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Send Reset Link
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
} 