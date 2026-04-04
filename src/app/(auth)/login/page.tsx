"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function toE164(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) return "+82" + digits.slice(1);
  return "+" + digits;
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // sms_autoconfirm=true 환경: signInWithOtp 성공 시 이미 세션이 생길 수 있음
  // 그 경우 자동으로 dashboard로 이동
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session) {
          router.push("/dashboard");
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [router]);

  async function handleSendOtp() {
    if (!phone.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone: toE164(phone),
      });

      if (error) {
        setError(`오류: ${error.message}`);
        return;
      }

      // 성공 → OTP 입력 단계
      setStep("otp");
    } catch (err) {
      setError(`오류: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.length < 6) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        phone: toE164(phone),
        token: otp,
        type: "sms",
      });

      if (error) {
        setError(`오류: ${error.message}`);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError(`오류: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white flex flex-col justify-center px-6">
      <div className="w-full max-w-sm mx-auto">

        {/* 헤더 */}
        <div className="mb-10 border-b-4 border-black pb-6">
          <p className="text-base font-bold text-(--gray-3) mb-2">매출 관리 앱</p>
          <h1 className="text-5xl font-black text-black leading-tight mb-3">로그인</h1>
          <p className="text-lg font-semibold text-(--gray-2)">
            {step === "phone"
              ? "전화번호를 입력하세요"
              : `인증번호를 입력하세요`}
          </p>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-(--red-bg) border-l-4 border-(--cal-sun)">
            <p className="text-base font-bold text-(--cal-sun) break-all">{error}</p>
          </div>
        )}

        {/* ── 전화번호 입력 단계 ── */}
        {step === "phone" && (
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-black text-black mb-3">
                전화번호
              </label>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                placeholder="01012345678"
                className="w-full border-2 border-(--gray-4) bg-white px-4 py-4 text-2xl font-bold text-black placeholder-(--gray-4) focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <button
              type="button"
              disabled={loading || !phone.trim()}
              onClick={handleSendOtp}
              className="w-full bg-black py-5 text-xl font-black text-white active:opacity-70 disabled:opacity-50 transition-opacity"
            >
              {loading ? "발송 중..." : "인증번호 받기"}
            </button>
          </div>
        )}

        {/* ── 인증번호 입력 단계 ── */}
        {step === "otp" && (
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-black text-black mb-3">
                인증번호 6자리
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                placeholder="000000"
                autoFocus
                className="w-full border-2 border-(--gray-4) bg-white px-4 py-4 text-center text-4xl font-black tracking-[0.5em] text-black placeholder-(--gray-4) focus:outline-none focus:border-black transition-colors"
              />
              <p className="mt-3 text-sm font-semibold text-(--gray-3)">
                {phone}로 발송된 6자리 숫자를 입력하세요
              </p>
            </div>

            <button
              type="button"
              disabled={loading || otp.length < 6}
              onClick={handleVerifyOtp}
              className="w-full bg-black py-5 text-xl font-black text-white active:opacity-70 disabled:opacity-50 transition-opacity"
            >
              {loading ? "확인 중..." : "로그인"}
            </button>

            <button
              type="button"
              onClick={() => { setStep("phone"); setError(null); setOtp(""); }}
              className="w-full py-3 text-base font-bold text-(--gray-3) active:text-black transition-colors"
            >
              ← 전화번호 다시 입력
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
