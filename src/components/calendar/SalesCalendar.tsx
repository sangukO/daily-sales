"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DayPicker } from "react-day-picker";
import { ko } from "react-day-picker/locale";
import "react-day-picker/style.css";
import SalesDayDialog from "./SalesDayDialog";
import { getSalesByMonth, getSalesByYear } from "@/lib/supabase/queries";
import { useGoalStore } from "@/store/goalStore";
import type { Sale } from "@/types";

function prevMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}
function nextMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export default function SalesCalendar() {
  const today = new Date();
  const [month, setMonth] = useState<Date>(today);
  const [salesMap, setSalesMap] = useState<Record<string, Sale>>({});
  const [yearTotal, setYearTotal] = useState<number>(0);
  const [dialogDate, setDialogDate] = useState<Date | null>(null);
  const [highlightedDate, setHighlightedDate] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    async function fetchSales() {
      try {
        const sales = await getSalesByMonth(month.getFullYear(), month.getMonth() + 1);
        const map: Record<string, Sale> = {};
        sales.forEach((sale) => { map[sale.date] = sale; });
        setSalesMap(map);
      } catch {
        // 로드 실패 시 빈 맵 유지
      }
    }
    void fetchSales();
  }, [month, refreshKey]);

  const prevYear = useRef<number | null>(null);
  useEffect(() => {
    const year = month.getFullYear();
    if (prevYear.current !== year || refreshKey > 0) {
      prevYear.current = year;
      getSalesByYear(year).then(setYearTotal).catch(() => {});
    }
  }, [month, refreshKey]);

  function toDateStr(date: Date): string {
    return date.toLocaleDateString("sv-SE");
  }

  const { monthlyGoal } = useGoalStore();
  const monthTotal = Object.values(salesMap).reduce((sum, s) => sum + s.amount, 0);
  const salesDayCount = Object.keys(salesMap).length;
  const achievementRate = monthlyGoal > 0
    ? Math.min(Math.round((monthTotal / monthlyGoal) * 100), 999)
    : null;

  const monthLabel = `${month.getFullYear()}년 ${month.getMonth() + 1}월`;

  return (
    <>
      <div className="min-h-screen bg-[#FAF7F0]">

        {/* ── 상단 헤더 — 레저 스타일 ── */}
        <div className="px-6 pt-14 pb-6">

          {/* 월 레이블 */}
          <p className="text-xs font-semibold tracking-[0.2em] text-[#9E8E7A] uppercase mb-4">
            {monthLabel}
          </p>

          {/* 월 매출 총합 — Playfair Display 대형 숫자 */}
          <div className="mb-1">
            <span className="font-(family-name:--font-playfair) text-5xl font-bold leading-none text-[#1C1208]">
              {monthTotal.toLocaleString("ko-KR")}
            </span>
            <span className="ml-2 text-lg font-medium text-[#9E8E7A]">원</span>
          </div>

          <p className="text-sm text-[#9E8E7A]">
            {salesDayCount > 0 ? `${salesDayCount}일 기록됨` : "이번 달 기록이 없어요"}
          </p>

          {/* 목표 달성률 */}
          {achievementRate !== null && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[#9E8E7A]">
                  목표 {monthlyGoal.toLocaleString("ko-KR")}원
                </span>
                <span className={`text-xs font-bold font-(family-name:--font-playfair) ${achievementRate >= 100 ? "text-[#4A7040]" : "text-[#B5732A]"}`}>
                  {achievementRate}%
                </span>
              </div>
              <div className="h-1 w-full rounded-full bg-[#EDE5D8] overflow-hidden">
                <div
                  className={`h-full w-full origin-left rounded-full transition-transform duration-700 ease-out ${achievementRate >= 100 ? "bg-[#4A7040]" : "bg-[#B5732A]"}`}
                  style={{ transform: `scaleX(${Math.min(achievementRate, 100) / 100})` }}
                />
              </div>
            </div>
          )}

          {/* 연도 누적 */}
          <div className="mt-5 pt-4 border-t border-[#DDD3C2] flex items-baseline justify-between">
            <span className="text-xs tracking-widest text-[#9E8E7A] uppercase">
              {month.getFullYear()}년 누적
            </span>
            <span>
              <span className="font-(family-name:--font-playfair) text-xl font-semibold text-[#6B5444]">
                {yearTotal.toLocaleString("ko-KR")}
              </span>
              <span className="ml-1 text-sm text-[#9E8E7A]">원</span>
            </span>
          </div>
        </div>

        {/* ── 구분선 ── */}
        <div className="mx-6 border-t border-[#DDD3C2]" />

        {/* ── 캘린더 ── */}
        <div className="px-3 pt-2 pb-4">

          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between px-1 py-3">
            <button
              onClick={() => setMonth(prevMonth(month))}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#9E8E7A] hover:bg-[#EDE5D8] transition-colors active:scale-95"
              aria-label="이전 달"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-[#1C1208] tracking-tight">
              {month.getFullYear()}.{String(month.getMonth() + 1).padStart(2, "0")}
            </span>
            <button
              onClick={() => setMonth(nextMonth(month))}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#9E8E7A] hover:bg-[#EDE5D8] transition-colors active:scale-95"
              aria-label="다음 달"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* DayPicker */}
          <DayPicker
            locale={ko}
            mode="single"
            month={month}
            onMonthChange={setMonth}
            onDayClick={(date) => { setDialogDate(date); setHighlightedDate(date); }}
            hideNavigation
            components={{
              MonthCaption: () => <></>,
              DayButton: ({ day, modifiers, ...props }) => {
                const dateStr = toDateStr(day.date);
                const sale = salesMap[dateStr];
                const amountStr = sale ? sale.amount.toLocaleString("ko-KR") : null;
                const isToday = modifiers.today;
                const isSelected = highlightedDate
                  ? dateStr === toDateStr(highlightedDate)
                  : false;
                const isOutside = modifiers.outside;

                return (
                  <button
                    {...props}
                    className={[
                      "relative flex h-12 w-full flex-col items-center justify-center gap-0.5",
                      "rounded-lg transition-all duration-150 active:scale-95 focus:outline-none",
                      isSelected
                        ? "bg-[#B5732A]"
                        : isToday
                        ? "ring-1 ring-[#B5732A] ring-inset"
                        : sale
                        ? "bg-[#FDF3E1]"
                        : "hover:bg-[#EDE5D8]",
                      isOutside ? "opacity-20" : "",
                    ].join(" ")}
                  >
                    <span
                      className={`text-sm font-semibold leading-none ${
                        isSelected
                          ? "text-white"
                          : isToday
                          ? "text-[#B5732A]"
                          : "text-[#1C1208]"
                      }`}
                    >
                      {day.date.getDate()}
                    </span>
                    {amountStr && (
                      <span
                        className={`truncate max-w-full px-0.5 text-[9px] font-bold leading-none ${
                          isSelected ? "text-[#FDF3E1]" : "text-[#4A7040]"
                        }`}
                      >
                        {amountStr}
                      </span>
                    )}
                  </button>
                );
              },
            }}
            classNames={{
              root: "w-full",
              months: "w-full",
              month: "w-full",
              month_caption: "hidden",
              weekdays: "w-full flex",
              weekday: "flex-1 py-2 text-center text-[11px] font-semibold text-[#C8BAA8] tracking-wider",
              weeks: "w-full space-y-1",
              week: "flex gap-1",
              day: "flex-1 min-w-0",
              outside: "",
              disabled: "opacity-30",
            }}
          />
        </div>

        <p className="pb-6 text-center text-xs text-[#C8BAA8]">
          날짜를 탭해서 매출을 기록하세요
        </p>
      </div>

      {/* 매출 입력 다이얼로그 */}
      {dialogDate && (
        <SalesDayDialog
          date={dialogDate}
          existingSale={salesMap[toDateStr(dialogDate)] ?? null}
          onCloseStart={() => setHighlightedDate(null)}
          onClose={() => setDialogDate(null)}
          onSaved={refresh}
        />
      )}
    </>
  );
}
