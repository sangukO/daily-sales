import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google 인증 코드를 서버 세션으로 교환합니다.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code && !searchParams.has("error")) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        const response = NextResponse.redirect(`${origin}/dashboard`);
        response.headers.set("Cache-Control", "no-store");
        return response;
      }
    } catch {
      // 연결 실패도 로그인 화면에서 다시 시도하도록 안내합니다.
    }
  }

  // 오류 발생 시 로그인 페이지로 복귀
  const response = NextResponse.redirect(`${origin}/login?error=auth`);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
