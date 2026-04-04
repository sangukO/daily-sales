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
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function handleClose() {
    onCloseStart();
    setVisible(false);
    setTimeout(onClose, 300);
  }

  const dateStr = date.toLocaleDateString("sv-SE");
  const displayDate = date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  async function handleSave() {
    if (amount <= 0) { setError("금액을 입력해주세요."); return; }
    setLoading(true);
    setError(null);
    try {
      await upsertSale({
        ...(existingSale?.id ? { id: existingSale.id } : {}),
        date: dateStr,
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
      className={`fixed inset-0 z-60 flex items-end justify-center bg-black/30 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-lg bg-[#FAF7F0] rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 바 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-[#DDD3C2]" />
        </div>

        <div className="px-6 pb-10 pt-3">
          {/* 날짜 */}
          <p className="mb-1 text-xs font-semibold tracking-widest text-[#9E8E7A] uppercase">
            매출 기록
          </p>
          <p className="mb-6 font-(family-name:--font-playfair) text-xl font-semibold text-[#1C1208]">
            {displayDate}
          </p>

          {/* 금액 입력 */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-semibold tracking-widest text-[#9E8E7A] uppercase">
              매출액
            </label>
            <CurrencyInput value={amount} onChange={setAmount} placeholder="0" />
          </div>

          {/* 메모 입력 */}
          <div className="mb-6">
            <label className="mb-2 block text-xs font-semibold tracking-widest text-[#9E8E7A] uppercase">
              메모 <span className="normal-case font-normal text-[#C8BAA8]">(선택)</span>
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="메모를 입력하세요"
              rows={2}
              className="w-full resize-none rounded-xl border border-[#DDD3C2] bg-white px-4 py-3 text-sm text-[#1C1208] placeholder-[#C8BAA8] focus:border-[#B5732A] focus:outline-none transition-colors"
            />
          </div>

          {/* 에러 */}
          {error && (
            <p className="mb-4 rounded-xl bg-[#FBEAEA] px-4 py-2 text-sm text-[#8B3030]">
              {error}
            </p>
          )}

          {/* 버튼 */}
          <div className="flex gap-2">
            {existingSale && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="rounded-xl border border-[#DDD3C2] px-4 py-3 text-sm font-semibold text-[#8B3030] hover:bg-[#FBEAEA] disabled:opacity-50 transition-colors"
              >
                삭제
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 rounded-xl bg-[#B5732A] py-3 text-sm font-bold text-white hover:bg-[#9A6023] disabled:opacity-50 transition-colors active:scale-95"
            >
              {loading ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
