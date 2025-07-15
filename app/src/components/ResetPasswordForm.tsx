"use client";

import { useState } from "react";
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
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password: data.password, confirmPassword: data.confirmPassword }),
      });
      if (!res.ok) throw new Error("Invalid or expired token");
      toast.success("Your password has been reset. You can now sign in with your new password.");
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    } catch (err) {
      form.setError("password", { message: "Invalid or expired token, or server error." });
      toast.error("Invalid or expired token, or server error.");
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return <div className="flex items-center justify-center min-h-screen text-red-600 font-bold">Invalid reset link.</div>;
  }

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