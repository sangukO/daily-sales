"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// 국내 전화번호를 E.164 형식으로 변환 (예: 01012345678 → +821012345678)
function toE164(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) {
    return "+82" + digits.slice(1);
  }
  return "+" + digits;
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: 전화번호 입력 → OTP 발송
  async function handleSendOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      phone: toE164(phone),
    });

    if (error) {
      setError("인증번호 발송에 실패했습니다. 전화번호를 확인해주세요.");
      setLoading(false);
      return;
    }

    setStep("otp");
    setLoading(false);
  }

  // Step 2: OTP 입력 → 로그인 완료
  async function handleVerifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      phone: toE164(phone),
      token: otp,
      type: "sms",
    });

    if (error) {
      setError("인증번호가 올바르지 않습니다.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5F3EE] px-4">
      <div className="w-full max-w-sm">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#1C2B3A]">매출 관리</h1>
          <p className="mt-1 text-sm text-[#7A9BB5]">
            {step === "phone" ? "전화번호로 로그인하세요" : `${phone}으로 발송된 인증번호를 입력하세요`}
          </p>
        </div>

        {/* Step 1 — 전화번호 입력 */}
        {step === "phone" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-[#1C2B3A] mb-1">
                전화번호
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
                className="w-full rounded-xl border border-[#E8E4DC] bg-white px-4 py-3 text-[#1C2B3A] placeholder-[#C5BEB4] focus:border-[#1C2B3A] focus:outline-none transition-colors"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#1C2B3A] px-4 py-3 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "발송 중..." : "인증번호 받기"}
            </button>
          </form>
        )}

        {/* Step 2 — OTP 입력 */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-[#1C2B3A] mb-1">
                인증번호 6자리
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="000000"
                className="w-full rounded-xl border border-[#E8E4DC] bg-white px-4 py-3 text-center text-2xl font-bold tracking-widest text-[#1C2B3A] placeholder-[#C5BEB4] focus:border-[#1C2B3A] focus:outline-none transition-colors"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#1C2B3A] px-4 py-3 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "확인 중..." : "로그인"}
            </button>

            <button
              type="button"
              onClick={() => { setStep("phone"); setError(null); setOtp(""); }}
              className="w-full rounded-xl py-2 text-sm text-[#7A9BB5] transition-colors hover:text-[#1C2B3A]"
            >
              전화번호 다시 입력
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
