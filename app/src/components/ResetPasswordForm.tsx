"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { resetPasswordSchema, ResetPasswordRequest } from "@/Validators/resetPassword";
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
import axios from "axios";

interface ResetPasswordFormProps {
  token: string;
  email: string;
}

export default function ResetPasswordForm({ token, email }: ResetPasswordFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<ResetPasswordRequest>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "", token },
    mode: "all",
  });

  const handleSubmit = async (data: ResetPasswordRequest) => {
    setLoading(true);
    try {
      const res = await axios.post('/api/reset-password', {
        token,
        email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      toast.success("Your password has been reset. You can now sign in with your new password.");
      setTimeout(() => {
        router.push("/signin");
      }, 1000);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || "Invalid or expired token, or server error.";
        form.setError("password", { message });
        toast.error(message);
      } else {
        form.setError("password", { message: "Unexpected error occurred." });
        toast.error("Unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-[#668D7E]">Reset Password</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Enter new password" minLength={8} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Confirm new password" minLength={8} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="bg-[#668D7E] hover:bg-[#557364] text-white font-bold py-2 px-4 rounded"
              isLoading={loading}
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
} 