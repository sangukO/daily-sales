import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 카카오 OAuth 로그인 후 Supabase가 리다이렉트하는 콜백 엔드포인트
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // 오류 발생 시 로그인 페이지로 복귀
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
