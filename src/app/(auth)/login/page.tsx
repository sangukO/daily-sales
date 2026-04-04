"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// 국내 전화번호를 E.164 형식으로 변환 (예: 01012345678 → +821012345678)
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

  async function handleSendOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ phone: toE164(phone) });
    if (error) {
      setError("인증번호 발송에 실패했습니다. 전화번호를 확인해주세요.");
      setLoading(false);
      return;
    }
    setStep("otp");
    setLoading(false);
  }

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
    <main className="min-h-screen flex items-center justify-center bg-[#FAF7F0] px-6">
      <div className="w-full max-w-sm">

        {/* 헤더 */}
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-[#9E8E7A] uppercase mb-3">
            Daily Sales
          </p>
          <h1 className="font-(family-name:--font-playfair) text-4xl font-bold text-[#1C1208] leading-tight">
            매출 관리
          </h1>
          <div className="mt-4 mx-auto w-8 h-px bg-[#DDD3C2]" />
          <p className="mt-4 text-sm text-[#9E8E7A]">
            {step === "phone"
              ? "전화번호로 로그인하세요"
              : `${phone}으로 발송된\n인증번호를 입력하세요`}
          </p>
        </div>

        {/* Step 1 — 전화번호 입력 */}
        {step === "phone" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold tracking-widest text-[#9E8E7A] uppercase mb-2">
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
                className="w-full rounded-xl border border-[#DDD3C2] bg-white px-4 py-3.5 text-[#1C1208] placeholder-[#C8BAA8] focus:border-[#B5732A] focus:outline-none transition-colors"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-[#FBEAEA] px-4 py-3 text-sm text-[#8B3030]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#B5732A] px-4 py-3.5 text-sm font-bold text-white hover:bg-[#9A6023] transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "발송 중..." : "인증번호 받기"}
            </button>
          </form>
        )}

        {/* Step 2 — OTP 입력 */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-xs font-semibold tracking-widest text-[#9E8E7A] uppercase mb-2">
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
                className="w-full rounded-xl border border-[#DDD3C2] bg-white px-4 py-3.5 text-center font-(family-name:--font-playfair) text-3xl font-bold tracking-[0.3em] text-[#1C1208] placeholder-[#C8BAA8] focus:border-[#B5732A] focus:outline-none transition-colors"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-[#FBEAEA] px-4 py-3 text-sm text-[#8B3030]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#B5732A] px-4 py-3.5 text-sm font-bold text-white hover:bg-[#9A6023] transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "확인 중..." : "로그인"}
            </button>

            <button
              type="button"
              onClick={() => { setStep("phone"); setError(null); setOtp(""); }}
              className="w-full py-2 text-sm text-[#9E8E7A] hover:text-[#6B5444] transition-colors"
            >
              전화번호 다시 입력
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
