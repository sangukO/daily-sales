"use client";

import { useState, useEffect, useRef } from "react";
import CurrencyInput from "./CurrencyInput";
import { upsertSale, deleteSale } from "@/lib/supabase/queries";
import { useToastStore } from "@/store/toastStore";
import type { Sale } from "@/types";

interface SalesDayDialogProps {
  date: Date;
  existingSale: Sale | null;
  onCloseStart: () => void;
  onClose: () => void;
  onSaved: () => void;
}

export default function SalesDayDialog({
  date,
  existingSale,
  onCloseStart,
  onClose,
  onSaved,
}: SalesDayDialogProps) {
  const [mode, setMode] = useState<"sales" | "holiday">(
    existingSale?.is_holiday ? "holiday" : "sales"
  );
  const [amount, setAmount] = useState(existingSale?.amount ?? 0);
  const [memo, setMemo] = useState(existingSale?.memo ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useToastStore((s) => s.show);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  function handleClose() {
    onCloseStart();
    setVisible(false);
    closeTimerRef.current = setTimeout(onClose, 280);
  }

  const DAY_NAMES = ["일요일","월요일","화요일","수요일","목요일","금요일","토요일"];
  const displayDate = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${DAY_NAMES[date.getDay()]}`;

  async function handleSave() {
    if (mode === "sales" && amount <= 0) {
      setError("금액을 입력해주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await upsertSale({
        ...(existingSale?.id ? { id: existingSale.id } : {}),
        date: date.toLocaleDateString("sv-SE"),
        amount: mode === "holiday" ? 0 : amount,
        memo: memo.trim() || null,
        is_holiday: mode === "holiday",
      });
      showToast("저장됐어요 ✓");
      onSaved();
      handleClose();
    } catch {
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!existingSale?.id) return;
    setLoading(true);
    setError(null);
    try {
      await deleteSale(existingSale.id);
      showToast("삭제됐어요");
      onSaved();
      handleClose();
    } catch {
      setError("삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-60 flex items-end justify-center bg-black/50 transition-opacity duration-280 ${visible ? "opacity-100" : "opacity-0"}`}
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-lg bg-white border-t-4 border-black transition-transform duration-280 ease-out ${visible ? "translate-y-0" : "translate-y-full"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-black">
          <div>
            <p className="text-xs text-(--gray-3) font-semibold mb-0.5">매출 기록</p>
            <p className="text-lg font-black text-black">{displayDate}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="닫기"
            className="w-11 h-11 flex items-center justify-center text-3xl font-light text-(--gray-3) active:bg-(--gray-5) rounded"
          >
            ×
          </button>
        </div>

        {/* 모드 탭 */}
        <div className="flex border-b-2 border-black">
          <button
            type="button"
            onClick={() => setMode("sales")}
            className={`flex-1 py-3 text-sm font-black transition-colors ${
              mode === "sales"
                ? "bg-black text-white"
                : "bg-white text-black active:bg-(--gray-5)"
            }`}
          >
            매출 입력
          </button>
          <button
            type="button"
            onClick={() => setMode("holiday")}
            className={`flex-1 py-3 text-sm font-black transition-colors ${
              mode === "holiday"
                ? "bg-black text-white"
                : "bg-white text-black active:bg-(--gray-5)"
            }`}
          >
            휴무일
          </button>
        </div>

        <div className="px-5 pb-8 pt-5 space-y-6">
          {mode === "holiday" ? (
            /* 휴무일 모드 */
            <div className="py-4">
              <p className="text-base font-bold text-(--gray-2) mb-4">
                이 날을 휴무일로 기록합니다.
              </p>
              {/* 메모 (휴무 이유 등) */}
              <div>
                <label className="block text-base font-black text-black mb-3">
                  메모{" "}
                  <span className="text-sm font-normal text-(--gray-3)">(선택사항)</span>
                </label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="휴무 이유를 입력하세요 (예: 추석, 공휴일)"
                  rows={2}
                  className="w-full resize-none border-2 border-(--gray-4) rounded-none bg-white px-4 py-3 text-lg text-black placeholder-(--gray-4) focus:outline-none focus:border-black transition-colors"
                />
              </div>
              {error && (
                <p className="text-base font-bold text-(--cal-sun) border-l-4 border-(--cal-sun) pl-4 mt-4">
                  {error}
                </p>
              )}
              <div className="flex gap-3 pt-4">
                {existingSale && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="border-2 border-black px-5 py-4 text-base font-black text-black active:bg-(--gray-5) disabled:opacity-40 transition-colors"
                  >
                    삭제
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-black py-4 text-lg font-black text-white active:opacity-70 disabled:opacity-40 transition-opacity"
                >
                  {loading ? "저장 중..." : "휴무일 저장"}
                </button>
              </div>
            </div>
          ) : (
            /* 매출 입력 모드 */
            <>
              {/* 금액 입력 */}
              <div>
                <label className="block text-base font-black text-black mb-3">
                  매출액
                </label>
                <CurrencyInput value={amount} onChange={setAmount} placeholder="0" />
                {/* 빠른 금액 추가 버튼 */}
                <div className="flex gap-2 mt-2">
                  {[100000, 300000, 500000].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAmount((prev) => prev + n)}
                      className="flex-1 border-2 border-black py-3 text-sm font-black active:bg-(--gray-5) transition-colors"
                    >
                      +{n / 10000}만
                    </button>
                  ))}
                </div>
              </div>
              {/* 메모 */}
              <div>
                <label className="block text-base font-black text-black mb-3">
                  메모{" "}
                  <span className="text-sm font-normal text-(--gray-3)">(선택사항)</span>
                </label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="간단한 메모를 입력하세요"
                  rows={2}
                  className="w-full resize-none border-2 border-(--gray-4) rounded-none bg-white px-4 py-3 text-lg text-black placeholder-(--gray-4) focus:outline-none focus:border-black transition-colors"
                />
              </div>
              {error && (
                <p className="text-base font-bold text-(--cal-sun) border-l-4 border-(--cal-sun) pl-4">
                  {error}
                </p>
              )}
              <div className="flex gap-3 pt-1">
                {existingSale && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="border-2 border-black px-5 py-4 text-base font-black text-black active:bg-(--gray-5) disabled:opacity-40 transition-colors"
                  >
                    삭제
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-black py-4 text-lg font-black text-white active:opacity-70 disabled:opacity-40 transition-opacity"
                >
                  {loading ? "저장 중..." : "저장하기"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
