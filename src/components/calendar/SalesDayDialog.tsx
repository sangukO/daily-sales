"use client";

import { useState, useEffect } from "react";
import CurrencyInput from "./CurrencyInput";
import { upsertSale, deleteSale } from "@/lib/supabase/queries";
import type { Sale } from "@/types";

interface SalesDayDialogProps {
  date: Date;
  existingSale: Sale | null;
  onCloseStart: () => void; // 애니메이션 시작 시 호출 (셀 하이라이트 즉시 해제용)
  onClose: () => void;      // 애니메이션 완료 후 호출 (컴포넌트 언마운트용)
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
  // 애니메이션 제어: false → true(슬라이드업), false(슬라이드다운) → onClose 호출
  const [visible, setVisible] = useState(false);

  // 마운트 직후 한 프레임 뒤에 visible = true → 슬라이드업 트리거
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // 다이얼로그 열릴 때 배경 스크롤 막기
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // 슬라이드다운 시작 → 셀 색 즉시 복원, 애니메이션 끝나면 언마운트
  function handleClose() {
    onCloseStart();
    setVisible(false);
    setTimeout(onClose, 300); // transition duration과 맞춤
  }

  // 날짜를 YYYY-MM-DD 형식으로 변환
  const dateStr = date.toLocaleDateString("sv-SE"); // sv-SE 로케일이 YYYY-MM-DD 형식 반환
  const displayDate = date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  async function handleSave() {
    if (amount <= 0) {
      setError("금액을 입력해주세요.");
      return;
    }
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
    /* 오버레이 */
    <div
      className={`fixed inset-0 z-60 flex items-end justify-center bg-black/40 px-0 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      {/* 다이얼로그 패널 — 클릭 이벤트 버블링 차단 */}
      <div
        className={`w-full max-w-lg rounded-t-2xl bg-white px-5 pb-8 pt-5 shadow-xl transition-transform duration-300 ease-out ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 바 */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300" />

        {/* 날짜 */}
        <p className="mb-5 text-base font-semibold text-gray-900">{displayDate}</p>

        {/* 금액 입력 */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            매출액
          </label>
          <CurrencyInput value={amount} onChange={setAmount} placeholder="0" />
        </div>

        {/* 메모 입력 */}
        <div className="mb-5">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            메모 <span className="text-gray-400">(선택)</span>
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="메모를 입력하세요"
            rows={2}
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* 버튼 */}
        <div className="flex gap-2">
          {existingSale && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="rounded-lg border border-red-200 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              삭제
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
