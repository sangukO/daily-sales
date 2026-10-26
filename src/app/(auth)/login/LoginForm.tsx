"use client";

import { useEffect, useRef, useState } from "react";
import { signInWithGoogle } from "@/lib/supabase/queries";

export default function LoginForm({ initialError }: { initialError: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ? "로그인을 완료하지 못했어요. 다시 시도해주세요." : null);
  const pending = useRef(false);

  useEffect(() => {
    // 인증 화면에서 뒤로 돌아와도 다시 시도할 수 있도록 복구합니다.
    const reset = () => {
      pending.current = false;
      setLoading(false);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  async function handleLogin() {
    if (pending.current) return;
    if (!navigator.onLine) {
      setError("로그인하려면 인터넷에 연결해주세요.");
      return;
    }
    pending.current = true;
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle(window.location.origin);
    } catch {
      pending.current = false;
      setLoading(false);
      setError("Google 로그인에 연결하지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  }

  return (
    <main className="min-h-dvh bg-white flex flex-col justify-center px-6 py-10">
      <div className="w-full max-w-sm mx-auto">
        <div className="mb-10 border-b-4 border-black pb-6">
          <p className="text-base font-bold text-(--gray-3) mb-2">매출 관리 앱</p>
          <h1 className="text-5xl font-black text-black leading-tight mb-3">로그인</h1>
          <p className="text-lg font-semibold text-(--gray-2)">Google 계정으로 시작하세요</p>
        </div>
        {error && (
          <div role="alert" className="mb-6 p-4 bg-(--red-bg) border-l-4 border-(--cal-sun)">
            <p className="text-base font-bold text-(--cal-sun)">{error}</p>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          aria-busy={loading}
          className="w-full border-2 border-black bg-white px-4 py-5 text-xl font-bold text-black active:bg-(--gray-5) disabled:opacity-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {loading ? "Google로 이동 중..." : "Google로 로그인"}
        </button>
        <p className="mt-5 text-base text-(--gray-3) leading-relaxed">
          이 휴대폰에서 사용하는 Google 계정을 선택해주세요.
          매출 기록은 선택한 계정에 저장됩니다.
        </p>
      </div>
    </main>
  );
}

