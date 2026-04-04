"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DayPicker } from "react-day-picker";
import { ko } from "react-day-picker/locale";
import "react-day-picker/style.css";
import SalesDayDialog from "./SalesDayDialog";
import { getSalesByMonth, getSalesByYear } from "@/lib/supabase/queries";
import { useGoalStore } from "@/store/goalStore";
import type { Sale } from "@/types";

// 이전 달 계산
function prevMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

// 다음 달 계산
function nextMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export default function SalesCalendar() {
  const today = new Date();
  const [month, setMonth] = useState<Date>(today);
  const [salesMap, setSalesMap] = useState<Record<string, Sale>>({});
  const [yearTotal, setYearTotal] = useState<number>(0);
  // dialogDate: 다이얼로그 마운트 제어 (애니메이션 끝까지 유지)
  const [dialogDate, setDialogDate] = useState<Date | null>(null);
  // highlightedDate: 셀 하이라이트 제어 (닫기 시작 즉시 해제)
  const [highlightedDate, setHighlightedDate] = useState<Date | null>(null);

  // 매출 다시 불러오기 트리거 (다이얼로그 저장 후 증가)
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

  // 연도가 바뀔 때마다 연도 총합 재조회
  const prevYear = useRef<number | null>(null);
  useEffect(() => {
    const year = month.getFullYear();
    // 연도 변경 시 또는 저장 후에만 재조회
    if (prevYear.current !== year || refreshKey > 0) {
      prevYear.current = year;
      getSalesByYear(year)
        .then(setYearTotal)
        .catch(() => {});
    }
  }, [month, refreshKey]);

  function toDateStr(date: Date): string {
    return date.toLocaleDateString("sv-SE");
  }

  const { monthlyGoal } = useGoalStore();
  const monthTotal = Object.values(salesMap).reduce((sum, s) => sum + s.amount, 0);
  const salesDayCount = Object.keys(salesMap).length;
  // 달성률 계산 (목표 미설정 시 null)
  const achievementRate = monthlyGoal > 0 ? Math.min(Math.round((monthTotal / monthlyGoal) * 100), 999) : null;

  return (
    <>
      <div className="min-h-screen bg-[#F5F3EE]">

        {/* ── 상단 요약 헤더 ── */}
        <div className="bg-[#1C2B3A] px-6 pt-14 pb-8">
          <p className="text-xs font-medium tracking-widest text-[#7A9BB5] uppercase mb-1">
            {month.getFullYear()}년 {month.getMonth() + 1}월
          </p>
          <p className="text-4xl font-bold text-white leading-none">
            {monthTotal.toLocaleString("ko-KR")}
            <span className="ml-1.5 text-xl font-normal text-[#7A9BB5]">원</span>
          </p>
          <p className="mt-3 text-sm text-[#7A9BB5]">
            {salesDayCount > 0 ? `${salesDayCount}일 기록됨` : "이번 달 기록이 없어요"}
          </p>

          {/* 목표 달성률 */}
          {achievementRate !== null && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[#7A9BB5]">
                  목표 {monthlyGoal.toLocaleString("ko-KR")}원
                </span>
                <span className={`text-xs font-bold ${achievementRate >= 100 ? "text-[#7DDBA5]" : "text-[#A8C5DA]"}`}>
                  {achievementRate}%
                </span>
              </div>
              {/* 프로그레스 바 — scaleX로 동적 너비 표현 (인라인 스타일 대체) */}
              <div className="h-1.5 w-full rounded-full bg-[#2C3D50] overflow-hidden">
                <div
                  className={`h-full w-full origin-left rounded-full transition-transform duration-500 ${achievementRate >= 100 ? "bg-[#7DDBA5]" : "bg-[#4A90D9]"}`}
                  style={{ transform: `scaleX(${Math.min(achievementRate, 100) / 100})` }}
                />
              </div>
            </div>
          )}

          {/* 연도 총합 */}
          <div className="mt-4 pt-4 border-t border-[#2C3D50]">
            <p className="text-xs font-medium tracking-widest text-[#7A9BB5] uppercase mb-1">
              {month.getFullYear()}년 누적
            </p>
            <p className="text-2xl font-bold text-[#A8C5DA] leading-none">
              {yearTotal.toLocaleString("ko-KR")}
              <span className="ml-1 text-base font-normal text-[#7A9BB5]">원</span>
            </p>
          </div>
        </div>

        {/* ── 캘린더 카드 ── */}
        <div className="mx-4 -mt-4 rounded-2xl bg-white shadow-sm shadow-black/5 overflow-hidden">

          {/* 직접 만든 월 네비게이션 */}
          <div className="flex items-center justify-between px-4 pt-4 pb-1">
            <button
              onClick={() => setMonth(prevMonth(month))}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#7A9BB5] hover:bg-[#F5F3EE] transition-colors active:scale-95"
              aria-label="이전 달"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-sm font-bold text-[#1C2B3A] tracking-tight">
              {month.getFullYear()}년 {month.getMonth() + 1}월
            </span>
            <button
              onClick={() => setMonth(nextMonth(month))}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#7A9BB5] hover:bg-[#F5F3EE] transition-colors active:scale-95"
              aria-label="다음 달"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* DayPicker — 내장 nav, caption 완전 숨김 */}
          <div className="px-3 pb-4">
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
                        "relative flex h-13 w-full flex-col items-center justify-center gap-0.5",
                        "rounded-xl transition-all duration-150 active:scale-95 focus:outline-none",
                        isSelected ? "bg-[#1C2B3A]"
                          : isToday ? "bg-[#EBF4FF]"
                          : sale ? "bg-[#F0FBF4]"
                          : "hover:bg-gray-50",
                        isOutside ? "opacity-25" : "",
                      ].join(" ")}
                    >
                      <span
                        className={`text-sm font-semibold leading-none ${
                          isSelected ? "text-white"
                            : isToday ? "text-[#2563EB]"
                            : "text-[#1C2B3A]"
                        }`}
                      >
                        {day.date.getDate()}
                      </span>
                      {amountStr && (
                        <span
                          className={`truncate max-w-full px-0.5 text-[9px] font-bold leading-none ${
                            isSelected ? "text-[#7DDBA5]" : "text-[#16A34A]"
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
                weekday: "flex-1 py-2 text-center text-[11px] font-semibold text-[#A0B4C5] tracking-wider",
                weeks: "w-full space-y-1",
                week: "flex gap-1",
                day: "flex-1 min-w-0",
                outside: "",
                disabled: "opacity-30",
              }}
            />
          </div>
        </div>

        {/* ── 하단 힌트 ── */}
        <p className="mt-4 mb-6 text-center text-xs text-[#A0B4C5]">
          날짜를 탭해서 매출을 기록하세요
        </p>
      </div>

      {/* 매출 입력 다이얼로그 */}
      {dialogDate && (
        <SalesDayDialog
          date={dialogDate}
          existingSale={salesMap[toDateStr(dialogDate)] ?? null}
          onCloseStart={() => setHighlightedDate(null)} // 애니메이션 시작 즉시 셀 색 복원
          onClose={() => setDialogDate(null)}           // 애니메이션 끝나면 언마운트
          onSaved={refresh}
        />
      )}
    </>
  );
}
