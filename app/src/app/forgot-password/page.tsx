import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function ForgotPasswordPage() {
  const { user } = await validateRequest();
  if (user) return redirect("/new");
  return <ForgotPasswordForm />;
} 