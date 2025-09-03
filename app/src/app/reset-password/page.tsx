"use client";

import { useSearchParams } from "next/navigation";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";
  return <ResetPasswordForm token={token} email={email} />;
} 