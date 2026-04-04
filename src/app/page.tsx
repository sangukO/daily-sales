import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// 인증 상태에 따라 적절한 페이지로 리다이렉트
export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect("/dashboard");
  }
  redirect("/login");
}
