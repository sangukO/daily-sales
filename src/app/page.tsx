import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// 루트 진입 시 로그인 여부에 따라 리다이렉트
export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
