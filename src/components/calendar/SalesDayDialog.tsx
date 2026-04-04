"use client";

import { useState, useEffect } from "react";
import CurrencyInput from "./CurrencyInput";
import { upsertSale, deleteSale } from "@/lib/supabase/queries";
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
  const [amount, setAmount] = useState(existingSale?.amount ?? 0);
  const [memo, setMemo] = useState(existingSale?.memo ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = orig; };
  }, []);

  function handleClose() {
    onCloseStart();
    setVisible(false);
    setTimeout(onClose, 280);
  }

  const DAY_NAMES = ["일요일","월요일","화요일","수요일","목요일","금요일","토요일"];
  const displayDate = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${DAY_NAMES[date.getDay()]}`;

  async function handleSave() {
    if (amount <= 0) { setError("금액을 입력해주세요."); return; }
    setLoading(true);
    setError(null);
    try {
      await upsertSale({
        ...(existingSale?.id ? { id: existingSale.id } : {}),
        date: date.toLocaleDateString("sv-SE"),
        amount,
        memo: memo.trim() || null,
      });
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
      className={`fixed inset-0 z-60 flex items-end justify-center transition-opacity duration-280 ${visible ? "opacity-100" : "opacity-0"}`}
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
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
            onClick={handleClose}
            className="w-11 h-11 flex items-center justify-center text-3xl font-light text-(--gray-3) active:bg-(--gray-5) rounded"
          >
            ×
          </button>
        </div>

        <div className="px-5 pb-8 pt-5 space-y-6">
          {/* 금액 입력 */}
          <div>
            <label className="block text-base font-black text-black mb-3">
              매출액
            </label>
            <CurrencyInput value={amount} onChange={setAmount} placeholder="0" />
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-base font-black text-black mb-3">
              메모 <span className="text-sm font-normal text-(--gray-3)">(선택사항)</span>
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="간단한 메모를 입력하세요"
              rows={2}
              className="w-full resize-none border-2 border-(--gray-4) rounded-none bg-white px-4 py-3 text-lg text-black placeholder-(--gray-4) focus:outline-none focus:border-black transition-colors"
            />
          </div>

          {/* 오류 */}
          {error && (
            <p className="text-base font-bold text-(--cal-sun) border-l-4 border-(--cal-sun) pl-4">
              {error}
            </p>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 pt-1">
            {existingSale && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="border-2 border-black px-5 py-4 text-base font-black text-black active:bg-(--gray-5) disabled:opacity-40 transition-colors"
              >
                삭제
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-black py-4 text-lg font-black text-white active:opacity-70 disabled:opacity-40 transition-opacity"
            >
              {loading ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
