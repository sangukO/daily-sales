"use client";

import { useState } from "react";
import { useGoalStore } from "@/store/goalStore";

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
    <div className="rounded-2xl bg-white border border-[#EDE5D8] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#EDE5D8]">
        <h2 className="text-sm font-bold text-[#1C1208]">월 목표 매출</h2>
        <p className="mt-0.5 text-xs text-[#9E8E7A]">매달 동일한 목표가 적용됩니다</p>
      </div>

      <div className="px-5 py-4 space-y-3">
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={handleChange}
            placeholder="0"
            className="w-full rounded-xl border border-[#DDD3C2] bg-[#FAF7F0] px-4 py-3 pr-10 text-right font-(family-name:--font-playfair) text-2xl font-semibold text-[#1C1208] placeholder-[#C8BAA8] focus:border-[#B5732A] focus:outline-none transition-colors"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#9E8E7A]">
            원
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 rounded-xl bg-[#B5732A] py-3 text-sm font-bold text-white hover:bg-[#9A6023] transition-colors active:scale-95"
          >
            {saved ? "저장됨 ✓" : "저장"}
          </button>
          {monthlyGoal > 0 && (
            <button
              onClick={handleClear}
              className="rounded-xl border border-[#DDD3C2] px-4 py-3 text-sm font-semibold text-[#9E8E7A] hover:bg-[#EDE5D8] transition-colors active:scale-95"
            >
              초기화
            </button>
          )}
        </div>

        {monthlyGoal > 0 && (
          <p className="text-center text-xs text-[#9E8E7A]">
            현재 목표:{" "}
            <span className="font-(family-name:--font-playfair) font-semibold text-[#B5732A]">
              {monthlyGoal.toLocaleString("ko-KR")}원
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
