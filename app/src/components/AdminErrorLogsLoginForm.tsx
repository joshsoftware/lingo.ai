"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { adminCredentialsSchema, type AdminCredentialsRequest } from "@/Validators/admin";

interface AdminErrorLogsLoginFormProps {
  onLogin: (data: AdminCredentialsRequest) => Promise<void>;
  loginError: string | null;
}

export default function AdminErrorLogsLoginForm({
  onLogin,
  loginError,
}: AdminErrorLogsLoginFormProps) {
  const form = useForm<AdminCredentialsRequest>({
    resolver: zodResolver(adminCredentialsSchema),
    defaultValues: { username: "", password: "" },
    mode: "all",
  });

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-2">Admin Error Logs</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Sign in with the admin credentials for the error-logs API.
        </p>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => onLogin(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      autoComplete="username"
                      placeholder="Admin username"
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="current-password"
                      placeholder="Password"
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {loginError && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {loginError}
              </p>
            )}
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}
