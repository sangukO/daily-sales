"use client";

import { useState } from "react";
import { useGoalStore } from "@/store/goalStore";

// 숫자 입력 시 콤마 포맷 처리
function formatNumber(value: string): string {
  const numeric = value.replace(/[^0-9]/g, "");
  if (!numeric) return "";
  return Number(numeric).toLocaleString("ko-KR");
}

function parseFormatted(value: string): number {
  return Number(value.replace(/,/g, "")) || 0;
}

export default function GoalSettings() {
  const { monthlyGoal, setMonthlyGoal } = useGoalStore();
  const [inputValue, setInputValue] = useState(
    monthlyGoal > 0 ? monthlyGoal.toLocaleString("ko-KR") : ""
  );
  const [saved, setSaved] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(formatNumber(e.target.value));
    setSaved(false);
  }

  function handleSave() {
    setMonthlyGoal(parseFormatted(inputValue));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleClear() {
    setInputValue("");
    setMonthlyGoal(0);
    setSaved(false);
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm shadow-black/5 overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F0EDE8]">
        <h2 className="text-sm font-bold text-[#1C2B3A]">월 목표 매출</h2>
        <p className="mt-0.5 text-xs text-[#A0B4C5]">매달 동일한 목표가 적용됩니다</p>
      </div>

      <div className="px-5 py-4 space-y-3">
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={handleChange}
            placeholder="0"
            className="w-full rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] px-4 py-3 pr-10 text-right text-lg font-bold text-[#1C2B3A] placeholder:text-[#D0CAC0] focus:border-[#1C2B3A] focus:outline-none transition-colors"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#7A9BB5]">
            원
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 rounded-xl bg-[#1C2B3A] py-3 text-sm font-bold text-white transition-all active:scale-95"
          >
            {saved ? "저장됨 ✓" : "저장"}
          </button>
          {monthlyGoal > 0 && (
            <button
              onClick={handleClear}
              className="rounded-xl border border-[#E8E4DC] px-4 py-3 text-sm font-semibold text-[#A0B4C5] transition-all active:scale-95"
            >
              초기화
            </button>
          )}
        </div>

        {monthlyGoal > 0 && (
          <p className="text-center text-xs text-[#7A9BB5]">
            현재 목표: {monthlyGoal.toLocaleString("ko-KR")}원
          </p>
        )}
      </div>
    </div>
  );
}
