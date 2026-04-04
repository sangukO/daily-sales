"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleKakaoLogin() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError("카카오 로그인에 실패했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5F3EE] px-4">
      <div className="w-full max-w-sm">
        {/* 헤더 */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold text-[#1C2B3A]">매출 관리</h1>
          <p className="mt-1 text-sm text-[#7A9BB5]">로그인하여 시작하세요</p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* 카카오 로그인 버튼 */}
        <button
          onClick={handleKakaoLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#FEE500] px-4 py-4 text-sm font-bold text-[#191919] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* 카카오 로고 */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10 2C5.582 2 2 4.925 2 8.5c0 2.275 1.484 4.274 3.726 5.435L4.9 17.1a.25.25 0 00.364.283L9.1 15.01c.297.026.598.04.9.04 4.418 0 8-2.925 8-6.55C18 4.925 14.418 2 10 2z"
              fill="#191919"
            />
          </svg>
          {loading ? "로그인 중..." : "카카오로 로그인"}
        </button>
      </div>
    </main>
  );
}
