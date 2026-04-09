"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DayPicker } from "react-day-picker";
import { ko } from "react-day-picker/locale";
import "react-day-picker/style.css";
import SalesDayDialog from "./SalesDayDialog";
import {
  getSalesByMonth,
  getSalesByYear,
  getSalesByRange,
} from "@/lib/supabase/queries";
import { useGoalStore } from "@/store/goalStore";
import { toDateStr, prevMonth, nextMonth, fmtShort, MONTHS_KO } from "@/lib/utils";
import type { Sale } from "@/types";

// 요일 0=일, 6=토
function getDayColor(dayOfWeek: number): string {
  if (dayOfWeek === 0) return "text-(--cal-sun)";
  if (dayOfWeek === 6) return "text-(--cal-sat)";
  return "text-(--cal-weekday)";
}

const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

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
  const [prevMonthTotal, setPrevMonthTotal] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [dialogDate, setDialogDate] = useState<Date | null>(null);
  const [highlightedDate, setHighlightedDate] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function fetchSales() {
      setFetchError(false);
      try {
        const sales = await getSalesByMonth(
          month.getFullYear(),
          month.getMonth() + 1,
        );
        if (cancelled) return;
        const map: Record<string, Sale> = {};
        sales.forEach((sale) => {
          map[sale.date] = sale;
        });
        setSalesMap(map);
      } catch {
        if (!cancelled) setFetchError(true);
      }
    }
    void fetchSales();
    return () => {
      cancelled = true;
    };
  }, [month, refreshKey]);

  useEffect(() => {
    let cancelled = false;
    const { start, end } = getThisWeekRange();
    getSalesByRange(start, end)
      .then((sales) => {
        if (!cancelled) setWeekTotal(sales.reduce((sum, s) => sum + s.amount, 0));
      })
      .catch(() => { if (!cancelled) setFetchError(true); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  useEffect(() => {
    let cancelled = false;
    async function fetchPrevMonth() {
      const today = new Date();
      const isCurrentMonthView =
        month.getFullYear() === today.getFullYear() &&
        month.getMonth() === today.getMonth();

      // 현재 달 조회 중: 전월 1일~오늘 같은 일자, 다른 달 조회 중: 전달 전체
      const compareDay = isCurrentMonthView
        ? today.getDate()
        : new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      const prevYearNum = month.getMonth() === 0 ? month.getFullYear() - 1 : month.getFullYear();
      const prevMonthIdx = month.getMonth() === 0 ? 12 : month.getMonth(); // 1-based
      const mm = String(prevMonthIdx).padStart(2, "0");
      const lastDayOfPrev = new Date(prevYearNum, prevMonthIdx, 0).getDate();
      const actualDay = Math.min(compareDay, lastDayOfPrev);
      const start = `${prevYearNum}-${mm}-01`;
      const end = `${prevYearNum}-${mm}-${String(actualDay).padStart(2, "0")}`;

      try {
        const sales = await getSalesByRange(start, end);
        if (cancelled) return;
        const total = sales
          .filter((s) => !s.is_holiday)
          .reduce((sum, s) => sum + s.amount, 0);
        setPrevMonthTotal(total > 0 ? total : null);
      } catch {
        if (!cancelled) setPrevMonthTotal(null);
      }
    }
    void fetchPrevMonth();
    return () => { cancelled = true; };
  }, [month, refreshKey]);

  const touchStartX = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta > 50) setMonth(prevMonth(month));
    else if (delta < -50) setMonth(nextMonth(month));
  }

  const prevYear = useRef<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    const year = month.getFullYear();
    if (prevYear.current !== year || refreshKey > 0) {
      prevYear.current = year;
      getSalesByYear(year)
        .then((total) => { if (!cancelled) setYearTotal(total); })
        .catch(() => { if (!cancelled) setFetchError(true); });
    }
    return () => { cancelled = true; };
  }, [month, refreshKey]);

  const { monthlyGoal, dailyGoal } = useGoalStore();
  const monthTotal = Object.values(salesMap).reduce(
    (sum, s) => sum + s.amount,
    0,
  );

  const today = new Date();
  const isCurrentMonth =
    month.getFullYear() === today.getFullYear() &&
    month.getMonth() === today.getMonth();
  const todaySale = salesMap[todayStr];
  const fabLabel = todaySale
    ? `✓ ${todaySale.amount >= 100000000 ? `${Math.round(todaySale.amount / 100000000)}억` : todaySale.amount >= 10000 ? `${Math.round(todaySale.amount / 10000)}만` : todaySale.amount.toLocaleString("ko-KR")}`
    : "오늘 +";
  const salesDayCount = Object.values(salesMap).filter(
    (s) => !s.is_holiday
  ).length;
  const achievementRate =
    monthlyGoal > 0
      ? Math.min(Math.round((monthTotal / monthlyGoal) * 100), 999)
      : null;

  const prevMonthDiff =
    prevMonthTotal !== null && prevMonthTotal > 0
      ? Math.round(((monthTotal - prevMonthTotal) / prevMonthTotal) * 100)
      : null;

  // 하단 통계
  const lastDayOfMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const daysLeftInMonth = isCurrentMonth
    ? lastDayOfMonth - today.getDate() + 1
    : 0;
  const remaining = monthlyGoal > 0 ? monthlyGoal - monthTotal : 0;
  const dailyNeeded =
    daysLeftInMonth > 0 && remaining > 0
      ? Math.ceil(remaining / daysLeftInMonth)
      : 0;
  const dailyAvg =
    salesDayCount > 0 ? Math.round(monthTotal / salesDayCount) : 0;

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden bg-white">
        {/* ── 상단 헤더 ── */}
        <div className="shrink-0 border-b-2 border-black">
          {/* 연도 + 월 제목 행 */}
          <div className="flex items-center px-3 pt-10 pb-1 gap-2 border-b border-(--gray-4)">
            <button
              onClick={() => setMonth(prevMonth(month))}
              className="w-11 h-11 flex items-center justify-center text-2xl font-bold text-(--gray-2) active:bg-(--gray-5) rounded"
              aria-label="이전 달"
            >
              ‹
            </button>
            <div className="flex-1 text-center">
              <span className="text-sm text-(--gray-3) font-medium">
                {month.getFullYear()}년
              </span>
              <h1 className="text-5xl font-black text-black leading-none tracking-tight">
                {MONTHS_KO[month.getMonth()]}
              </h1>
            </div>
            <button
              onClick={() => setMonth(nextMonth(month))}
              className="w-11 h-11 flex items-center justify-center text-2xl font-bold text-(--gray-2) active:bg-(--gray-5) rounded"
              aria-label="다음 달"
            >
              ›
            </button>
          </div>

          {/* 오늘로 돌아오기 — 현재 달이 아닐 때만 표시 */}
          {!isCurrentMonth && (
            <div className="flex justify-center py-1.5 border-b border-(--gray-4)">
              <button
                type="button"
                onClick={() => setMonth(new Date())}
                className="border-2 border-black px-5 py-1.5 text-sm font-black active:bg-(--gray-5) transition-colors"
              >
                오늘로
              </button>
            </div>
          )}

          {/* 월 매출 요약 행 */}
          <div className="flex items-center px-4 py-2 gap-3">
            <div className="flex-1">
              <p className="text-xs text-(--gray-3) font-medium mb-0.5">
                이달 총매출{" "}
                {salesDayCount > 0 ? `(${salesDayCount}일 기록)` : ""}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-black tabular-nums leading-none">
                  {monthTotal.toLocaleString("ko-KR")}
                </span>
                <span className="text-base font-bold text-(--gray-2)">
                  원
                </span>
              </div>
            </div>

            {/* 목표 달성률 */}
            {achievementRate !== null && (
              <div className="text-right shrink-0">
                <p className="text-xs text-(--gray-3) mb-0.5">월 목표</p>
                <p
                  className={`text-2xl font-black tabular-nums leading-none ${achievementRate >= 100 ? "text-(--green)" : "text-black"}`}
                >
                  {achievementRate}%
                </p>
              </div>
            )}
          </div>

          {/* 목표 진행 바 */}
          {achievementRate !== null && (
            <div className="h-2 bg-(--gray-5) mx-0">
              <div
                className={`h-full transition-all duration-700 ${achievementRate >= 100 ? "bg-(--green)" : "bg-black"}`}
                style={{ width: `${Math.min(achievementRate, 100)}%` }}
              />
            </div>
          )}

          {/* 전월 대비 */}
          {prevMonthDiff !== null && (
            <div className="flex items-center justify-between px-4 py-1.5 bg-(--gray-6) border-t border-(--gray-5)">
              <span className="text-sm font-semibold text-(--gray-2)">전월 대비</span>
              <span
                className={`text-base font-black tabular-nums ${
                  prevMonthDiff > 0
                    ? "text-(--green)"
                    : prevMonthDiff < 0
                      ? "text-(--cal-sun)"
                      : "text-(--gray-3)"
                }`}
              >
                {prevMonthDiff > 0 ? "▲" : prevMonthDiff < 0 ? "▼" : "—"}{" "}
                {Math.abs(prevMonthDiff)}%
              </span>
            </div>
          )}

          {/* 이번 주 소계 */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-(--gray-6) border-t border-(--gray-5)">
            <span className="text-sm font-semibold text-(--gray-2)">
              이번 주
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-black tabular-nums">
                {weekTotal.toLocaleString("ko-KR")}
              </span>
              <span className="text-sm font-bold text-(--gray-2)">원</span>
            </div>
          </div>

          {/* 연간 누적 */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-(--gray-6) border-t border-(--gray-5)">
            <span className="text-sm font-semibold text-(--gray-2)">
              {month.getFullYear()}년 누적
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-black tabular-nums">
                {yearTotal.toLocaleString("ko-KR")}
              </span>
              <span className="text-sm font-bold text-(--gray-2)">원</span>
            </div>
          </div>
        </div>

        {/* ── 달력 본체 ── */}
        <div
          className="flex-1 overflow-hidden flex flex-col min-h-0"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* 요일 헤더 */}
          <div className="shrink-0 grid grid-cols-7 border-b-2 border-black divide-x divide-(--gray-4)">
            {WEEKDAYS_KO.map((day, i) => (
              <div
                key={day}
                className={[
                  "py-2 text-center text-base font-black",
                  i === 0
                    ? "text-(--cal-sun)"
                    : i === 6
                      ? "text-(--cal-sat)"
                      : "text-black",
                ].join(" ")}
              >
                {day}
              </div>
            ))}
          </div>

          {/* DayPicker 날짜 그리드 */}
          <div className="shrink-0">
            <DayPicker
              locale={ko}
              mode="single"
              month={month}
              onMonthChange={setMonth}
              onDayClick={(date) => {
                setDialogDate(date);
                setHighlightedDate(date);
              }}
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
                  let bgClass = "bg-white active:bg-(--gray-6)";
                  if (isSelected) {
                    bgClass = "bg-black";
                  } else if (sale?.is_holiday) {
                    bgClass = "bg-(--gray-6)"; // 휴무일: 회색
                  } else if (isToday) {
                    bgClass = "bg-[#FFF9C4]"; // 연한 노랑 — 오늘 강조
                  } else if (!isOutside && sale) {
                    if (dailyGoal > 0 && isPastOrToday) {
                      bgClass =
                        sale.amount >= dailyGoal
                          ? "bg-(--green-bg)"
                          : "bg-(--red-bg)";
                    } else {
                      bgClass = "bg-[#F0F8FF]"; // 매출 있는 날 — 연한 파랑
                    }
                  }

                  // 날짜 숫자 색상
                  let numColor = getDayColor(dayOfWeek);
                  if (isSelected) numColor = "text-white";
                  else if (isOutside) numColor = "text-(--gray-4)";

                  // 금액 포맷 (짧게)
                  let amountStr = "";
                  if (sale && !isOutside) {
                    amountStr =
                      sale.amount >= 100000000
                        ? `${Math.round(sale.amount / 100000000)}억`
                        : sale.amount >= 10000
                          ? `${Math.round(sale.amount / 10000)}만`
                          : sale.amount.toLocaleString("ko-KR");
                  }

                  return (
                    <button
                      {...props}
                      className={[
                        "relative w-full h-full flex flex-col items-center justify-center",
                        "",
                        "focus:outline-none transition-colors",
                        bgClass,
                        isOutside ? "opacity-40" : "",
                      ].join(" ")}
                    >
                      {/* 오늘 표시 점 */}
                      {isToday && !isSelected && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-300" />
                      )}
                      {/* 날짜 숫자 — 크고 굵게 */}
                      <span
                        className={`text-2xl font-black leading-none ${numColor}`}
                      >
                        {day.date.getDate()}
                      </span>
                      {/* 매출 금액 또는 휴무 표시 */}
                      {sale && !isOutside && (
                        sale.is_holiday ? (
                          <span className="text-[10px] font-bold leading-tight mt-0.5 text-(--gray-3)">
                            휴
                          </span>
                        ) : amountStr ? (
                          <span
                            className={[
                              "text-[10px] font-bold leading-tight mt-0.5",
                              isSelected
                                ? "text-white/90"
                                : dailyGoal > 0 &&
                                    isPastOrToday &&
                                    sale.amount < dailyGoal
                                  ? "text-(--cal-sun)"
                                  : "text-(--gray-1)",
                            ].join(" ")}
                          >
                            {amountStr}
                          </span>
                        ) : null
                      )}
                    </button>
                  );
                },
              }}
              classNames={{
                root: "w-full flex flex-col",
                months: "w-full flex flex-col",
                month: "w-full flex flex-col",
                month_caption: "hidden",
                weekdays: "hidden" /* 우리가 직접 렌더링 */,
                weekday: "hidden",
                weeks: "w-full flex flex-col border-t border-(--gray-4)",
                week: "flex divide-x divide-(--gray-4) border-b border-(--gray-4)",
                day: "flex-1 min-w-0 aspect-square",
                outside: "",
                disabled: "opacity-30",
              }}
            />
          </div>

          {/* ── 하단 통계 ── */}
          <div className="shrink-0 flex items-center px-5 py-3 border-t-2 border-(--gray-5) bg-(--gray-6)">
            {monthlyGoal > 0 ? (
              remaining > 0 ? (
                <div className="w-full">
                  <p className="text-xs font-bold text-(--gray-3) mb-0.5">
                    {isCurrentMonth
                      ? `${daysLeftInMonth}일 남음 · 목표까지`
                      : "목표까지"}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-xl font-black text-black tabular-nums">
                      {fmtShort(remaining)} 남았어요
                    </p>
                    {dailyNeeded > 0 && (
                      <p className="text-sm font-bold text-(--gray-3) tabular-nums">
                        하루 {fmtShort(dailyNeeded)}씩
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  <p className="text-xs font-bold text-(--green) mb-0.5">
                    이달 목표 달성
                  </p>
                  <p className="text-xl font-black text-(--green) tabular-nums">
                    +{fmtShort(Math.abs(remaining))} 초과
                  </p>
                </div>
              )
            ) : (
              <div className="w-full">
                <p className="text-xs font-bold text-(--gray-3) mb-0.5">
                  일 평균
                </p>
                <p className="text-xl font-black text-black tabular-nums">
                  {dailyAvg > 0 ? fmtShort(dailyAvg) : "—"}
                </p>
              </div>
            )}
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

      {/* 데이터 로드 오류 */}
      {fetchError && (
        <div className="fixed top-14 left-0 right-0 z-50 bg-(--cal-sun) text-white text-sm font-bold text-center py-2 px-4">
          데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </div>
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
