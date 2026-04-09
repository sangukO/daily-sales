"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TEST_PHONE = process.env.NEXT_PUBLIC_DEV_TEST_PHONE ?? null;
const TEST_OTP = process.env.NEXT_PUBLIC_DEV_TEST_OTP ?? null;

function toE164(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) return "+82" + digits.slice(1);
  return "+" + digits;
}

/** 숫자만 추출 후 010-XXXX-XXXX 형식으로 포맷 */
function formatPhone(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/** 하이픈 제거한 순수 숫자 */
function digitsOnly(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);

    // 테스트 번호 입력 완료 시 자동으로 다음 단계
    if (TEST_PHONE && digitsOnly(formatted) === TEST_PHONE) {
      handleSendOtp(formatted);
    }
  }

  function handleOtpChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setOtp(value);

    // 테스트 OTP 입력 완료 시 자동 인증
    if (TEST_OTP && value === TEST_OTP) {
      handleVerifyOtp(value);
    }
  }

  async function handleSendOtp(phoneOverride?: string) {
    const target = phoneOverride ?? phone;
    if (!target.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone: toE164(target),
      });

      if (error) {
        setError(`오류: ${error.message}`);
        return;
      }

      setStep("otp");
    } catch (err) {
      setError(`오류: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(otpOverride?: string) {
    const token = otpOverride ?? otp;
    if (token.length < 6) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        phone: toE164(phone),
        token,
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
              : "인증번호를 입력하세요"}
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
                onChange={handlePhoneChange}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                placeholder="010-0000-0000"
                className="w-full border-2 border-(--gray-4) bg-white px-4 py-4 text-2xl font-bold text-black placeholder-(--gray-4) focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <button
              type="button"
              disabled={loading || !phone.trim()}
              onClick={() => handleSendOtp()}
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
                onChange={handleOtpChange}
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
              onClick={() => handleVerifyOtp()}
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
