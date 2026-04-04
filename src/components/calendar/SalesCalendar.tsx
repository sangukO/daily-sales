"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DayPicker } from "react-day-picker";
import { ko } from "react-day-picker/locale";
import "react-day-picker/style.css";
import SalesDayDialog from "./SalesDayDialog";
import { getSalesByMonth, getSalesByYear, getSalesByRange } from "@/lib/supabase/queries";
import { useGoalStore } from "@/store/goalStore";
import type { Sale } from "@/types";

function prevMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}
function nextMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

// 요일 0=일, 6=토
function getDayColor(dayOfWeek: number): string {
  if (dayOfWeek === 0) return "text-[var(--cal-sun)]";
  if (dayOfWeek === 6) return "text-[var(--cal-sat)]";
  return "text-[var(--cal-weekday)]";
}

const MONTHS_KO = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const WEEKDAYS_KO = ["일","월","화","수","목","금","토"];

// 이번 주(월~일) 날짜 범위 반환
function getThisWeekRange(): { start: string; end: string } {
  const today = new Date();
  const day = today.getDay(); // 0=일, 1=월, ...
  const diff = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return {
    start: weekStart.toLocaleDateString("sv-SE"),
    end: weekEnd.toLocaleDateString("sv-SE"),
  };
}

export default function SalesCalendar() {
  const [month, setMonth] = useState<Date>(() => new Date());
  const todayStr = new Date().toLocaleDateString("sv-SE");
  const [salesMap, setSalesMap] = useState<Record<string, Sale>>({});
  const [yearTotal, setYearTotal] = useState<number>(0);
  const [weekTotal, setWeekTotal] = useState<number>(0);
  const [dialogDate, setDialogDate] = useState<Date | null>(null);
  const [highlightedDate, setHighlightedDate] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function fetchSales() {
      try {
        const sales = await getSalesByMonth(month.getFullYear(), month.getMonth() + 1);
        if (cancelled) return;
        const map: Record<string, Sale> = {};
        sales.forEach((sale) => { map[sale.date] = sale; });
        setSalesMap(map);
      } catch { /* 오류 무시 */ }
    }
    void fetchSales();
    return () => { cancelled = true; };
  }, [month, refreshKey]);

  useEffect(() => {
    const { start, end } = getThisWeekRange();
    getSalesByRange(start, end)
      .then((sales) => setWeekTotal(sales.reduce((sum, s) => sum + s.amount, 0)))
      .catch(() => {});
  }, [refreshKey]);

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

  const { monthlyGoal, dailyGoal } = useGoalStore();
  const monthTotal = Object.values(salesMap).reduce((sum, s) => sum + s.amount, 0);

  const today = new Date();
  const isCurrentMonth =
    month.getFullYear() === today.getFullYear() &&
    month.getMonth() === today.getMonth();
  const todaySale = salesMap[todayStr];
  const fabLabel = todaySale
    ? `✓ ${todaySale.amount >= 10000 ? `${Math.round(todaySale.amount / 10000)}만` : todaySale.amount.toLocaleString("ko-KR")}`
    : "오늘 +";
  const salesDayCount = Object.keys(salesMap).length;
  const achievementRate = monthlyGoal > 0
    ? Math.min(Math.round((monthTotal / monthlyGoal) * 100), 999)
    : null;

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden bg-white">

        {/* ── 상단 헤더 ── */}
        <div className="shrink-0 border-b-2 border-black">

          {/* 연도 + 월 제목 행 */}
          <div className="flex items-center px-3 pt-10 pb-1 gap-2 border-b border-[var(--gray-4)]">
            <button
              onClick={() => setMonth(prevMonth(month))}
              className="w-11 h-11 flex items-center justify-center text-2xl font-bold text-[var(--gray-2)] active:bg-[var(--gray-5)] rounded"
              aria-label="이전 달"
            >
              ‹
            </button>
            <div className="flex-1 text-center">
              <span className="text-sm text-[var(--gray-3)] font-medium">
                {month.getFullYear()}년
              </span>
              <h1 className="text-5xl font-black text-black leading-none tracking-tight">
                {MONTHS_KO[month.getMonth()]}
              </h1>
            </div>
            <button
              onClick={() => setMonth(nextMonth(month))}
              className="w-11 h-11 flex items-center justify-center text-2xl font-bold text-[var(--gray-2)] active:bg-[var(--gray-5)] rounded"
              aria-label="다음 달"
            >
              ›
            </button>
          </div>

          {/* 월 매출 요약 행 */}
          <div className="flex items-center px-4 py-2 gap-3">
            <div className="flex-1">
              <p className="text-xs text-[var(--gray-3)] font-medium mb-0.5">
                이달 총매출 {salesDayCount > 0 ? `(${salesDayCount}일 기록)` : ""}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-black tabular-nums leading-none">
                  {monthTotal.toLocaleString("ko-KR")}
                </span>
                <span className="text-base font-bold text-[var(--gray-2)]">원</span>
              </div>
            </div>

            {/* 목표 달성률 */}
            {achievementRate !== null && (
              <div className="text-right shrink-0">
                <p className="text-xs text-[var(--gray-3)] mb-0.5">월 목표</p>
                <p className={`text-2xl font-black tabular-nums leading-none ${achievementRate >= 100 ? "text-[var(--green)]" : "text-black"}`}>
                  {achievementRate}%
                </p>
              </div>
            )}
          </div>

          {/* 목표 진행 바 */}
          {achievementRate !== null && (
            <div className="h-2 bg-[var(--gray-5)] mx-0">
              <div
                className={`h-full transition-all duration-700 ${achievementRate >= 100 ? "bg-[var(--green)]" : "bg-black"}`}
                style={{ width: `${Math.min(achievementRate, 100)}%` }}
              />
            </div>
          )}

          {/* 이번 주 소계 */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-[var(--gray-6)] border-t border-[var(--gray-5)]">
            <span className="text-sm font-semibold text-[var(--gray-2)]">이번 주</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-black tabular-nums">{weekTotal.toLocaleString("ko-KR")}</span>
              <span className="text-sm font-bold text-[var(--gray-2)]">원</span>
            </div>
          </div>

          {/* 연간 누적 */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-[var(--gray-6)] border-t border-[var(--gray-5)]">
            <span className="text-sm font-semibold text-[var(--gray-2)]">{month.getFullYear()}년 누적</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-black tabular-nums">{yearTotal.toLocaleString("ko-KR")}</span>
              <span className="text-sm font-bold text-[var(--gray-2)]">원</span>
            </div>
          </div>
        </div>

        {/* ── 달력 본체 ── */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">

          {/* 요일 헤더 */}
          <div className="shrink-0 grid grid-cols-7 border-b-2 border-black">
            {WEEKDAYS_KO.map((day, i) => (
              <div
                key={day}
                className={[
                  "py-2 text-center text-base font-black border-r border-[var(--gray-4)] last:border-r-0",
                  i === 0 ? "text-[var(--cal-sun)]" : i === 6 ? "text-[var(--cal-sat)]" : "text-black",
                ].join(" ")}
              >
                {day}
              </div>
            ))}
          </div>

          {/* DayPicker 날짜 그리드 */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
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
                  const dayOfWeek = day.date.getDay();
                  const isToday = modifiers.today;
                  const isSelected = highlightedDate
                    ? dateStr === toDateStr(highlightedDate)
                    : false;
                  const isOutside = modifiers.outside;
                  const isPastOrToday = dateStr <= todayStr;

                  // 배경색 결정
                  let bgClass = "bg-white active:bg-[var(--gray-6)]";
                  if (isSelected) {
                    bgClass = "bg-black";
                  } else if (isToday) {
                    bgClass = "bg-[#FFF9C4]"; // 연한 노랑 — 오늘 강조
                  } else if (!isOutside && sale) {
                    if (dailyGoal > 0 && isPastOrToday) {
                      bgClass = sale.amount >= dailyGoal ? "bg-[var(--green-bg)]" : "bg-[var(--red-bg)]";
                    } else {
                      bgClass = "bg-[#F0F8FF]"; // 매출 있는 날 — 연한 파랑
                    }
                  }

                  // 날짜 숫자 색상
                  let numColor = getDayColor(dayOfWeek);
                  if (isSelected) numColor = "text-white";
                  else if (isOutside) numColor = "text-[var(--gray-4)]";

                  // 금액 포맷 (짧게)
                  let amountStr = "";
                  if (sale && !isOutside) {
                    amountStr = sale.amount >= 10000
                      ? `${Math.round(sale.amount / 10000)}만`
                      : sale.amount.toLocaleString("ko-KR");
                  }

                  return (
                    <button
                      {...props}
                      className={[
                        "relative w-full h-full flex flex-col items-center justify-center",
                        "border-r border-b border-[var(--gray-4)] last-of-type:border-r-0",
                        "focus:outline-none transition-colors",
                        bgClass,
                        isOutside ? "opacity-40" : "",
                      ].join(" ")}
                    >
                      {/* 오늘 표시 점 */}
                      {isToday && !isSelected && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--cal-sun)]" />
                      )}
                      {/* 날짜 숫자 — 크고 굵게 */}
                      <span className={`text-2xl font-black leading-none ${numColor}`}>
                        {day.date.getDate()}
                      </span>
                      {/* 매출 금액 */}
                      {amountStr && (
                        <span className={[
                          "text-[10px] font-bold leading-tight mt-0.5",
                          isSelected ? "text-white/90"
                            : dailyGoal > 0 && isPastOrToday && sale && sale.amount < dailyGoal
                              ? "text-[var(--cal-sun)]"
                              : "text-[var(--gray-1)]",
                        ].join(" ")}>
                          {amountStr}
                        </span>
                      )}
                    </button>
                  );
                },
              }}
              classNames={{
                root: "w-full flex-1 flex flex-col min-h-0",
                months: "w-full flex-1 flex flex-col min-h-0",
                month: "w-full flex-1 flex flex-col min-h-0",
                month_caption: "hidden",
                weekdays: "hidden", /* 우리가 직접 렌더링 */
                weekday: "hidden",
                weeks: "w-full flex flex-col",
                week: "flex h-[40px]",
                day: "flex-1 min-w-0",
                outside: "",
                disabled: "opacity-30",
              }}
            />
          </div>
        </div>
      </div>

      {/* 오늘 빠른 입력 FAB */}
      {isCurrentMonth && (
        <button
          className="fixed bottom-20 right-4 z-40 bg-black text-white rounded-full px-4 py-3 text-sm font-black shadow-lg active:opacity-70 transition-opacity"
          onClick={() => {
            setDialogDate(today);
            setHighlightedDate(today);
          }}
        >
          {fabLabel}
        </button>
      )}

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
