"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { getSalesByRange } from "@/lib/supabase/queries";
import { useGoalStore } from "@/store/goalStore";
import { toDateStr } from "@/lib/utils";

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// 예: weekStart가 4월 27일(월)이면 → "4월 4주차"
function getWeekLabel(weekStart: Date): string {
  const month = weekStart.getMonth() + 1;
  const weekNum = Math.ceil(weekStart.getDate() / 7);
  return `${month}월 ${weekNum}주차`;
}

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

interface DayItem { label: string; amount: number; }

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-black px-3 py-2">
      <p className="text-sm text-white/60">{label}요일</p>
      <p className="text-base font-black text-white tabular-nums">
        {payload[0].value.toLocaleString("ko-KR")}원
      </p>
    </div>
  );
}

interface ChartWeeklyProps { compact?: boolean; }

export default function ChartWeekly({ compact = false }: ChartWeeklyProps) {
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [chartData, setChartData] = useState<DayItem[]>([]);
  const [weekTotal, setWeekTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const { weeklyGoal } = useGoalStore();
  const rate = weeklyGoal > 0
    ? Math.min(Math.round((weekTotal / weeklyGoal) * 100), 999)
    : null;

  const goToPrevWeek = () => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const goToNextWeek = () => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(false);
    async function fetchData() {
      try {
        const endDate = new Date(weekStart);
        endDate.setDate(endDate.getDate() + 6);
        const sales = await getSalesByRange(toDateStr(weekStart), toDateStr(endDate));
        if (cancelled) return;

        // 월~일 7일치 맵 구성
        const dayMap: Record<string, number> = {};
        for (let i = 0; i < 7; i++) {
          const d = new Date(weekStart);
          d.setDate(d.getDate() + i);
          dayMap[toDateStr(d)] = 0;
        }
        sales.forEach((sale) => {
          if (sale.date in dayMap) dayMap[sale.date] += sale.amount;
        });

        const data = Object.keys(dayMap).map((dateStr, i) => ({
          label: WEEKDAY_LABELS[i],
          amount: dayMap[dateStr],
        }));

        setChartData(data);
        setWeekTotal(sales.reduce((sum, s) => sum + s.amount, 0));
      } catch {
        if (!cancelled) setFetchError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchData();
    return () => { cancelled = true; };
  }, [weekStart]);

  const activeDayCount = chartData.filter((d) => d.amount > 0).length;

  return (
    <div className="flex flex-col bg-white h-full">
      {/* 헤더 */}
      <div className={`shrink-0 border-b-2 border-(--gray-5) px-5 pb-4 ${compact ? "pt-4" : "pt-12"}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goToPrevWeek}
              aria-label="이전 주"
              className="w-11 h-11 flex items-center justify-center text-2xl font-bold text-(--gray-3) active:bg-(--gray-6) rounded">‹</button>
            <h2 className="text-3xl font-black text-black">{getWeekLabel(weekStart)}</h2>
            <button
              type="button"
              onClick={goToNextWeek}
              aria-label="다음 주"
              className="w-11 h-11 flex items-center justify-center text-2xl font-bold text-(--gray-3) active:bg-(--gray-6) rounded">›</button>
          </div>
          <span className="text-sm font-bold text-(--gray-3)">
            {activeDayCount > 0 ? `${activeDayCount}일 기록` : "기록 없음"}
          </span>
        </div>

        {/* 주간 매출 + 목표 금액 */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-4xl font-black text-black tabular-nums">
            {weekTotal.toLocaleString("ko-KR")}
          </span>
          <span className="text-xl font-bold text-(--gray-2)">원</span>
          {weeklyGoal > 0 && (
            <span className="text-sm font-bold text-(--gray-3) ml-1">
              / {weeklyGoal.toLocaleString("ko-KR")}원
            </span>
          )}
        </div>

        {/* 목표 달성률 */}
        {rate !== null && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-bold text-(--gray-3)">주간 목표 달성률</span>
              <span className={`text-sm font-black ${rate >= 100 ? "text-(--green)" : "text-black"}`}>
                {rate}%
              </span>
            </div>
            <div className="h-3 bg-(--gray-5)">
              <div
                className={`h-full transition-all duration-700 ${rate >= 100 ? "bg-(--green)" : "bg-black"}`}
                style={{ width: `${Math.min(rate, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 차트 — 요일별 일간 막대 */}
      <div className="px-2 pt-3 pb-2">
        {fetchError ? (
          <div className="h-60 flex items-center justify-center text-base font-bold text-(--cal-sun)">
            데이터를 불러오지 못했습니다
          </div>
        ) : loading ? (
          <div className="h-60 flex items-center justify-center text-lg font-bold text-(--gray-4)">
            불러오는 중...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240} minHeight={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }} barSize={36}>
              <CartesianGrid vertical={false} stroke="#EEEEEE" />
              <XAxis dataKey="label"
                tick={{ fontSize: 11, fill: "#999", fontWeight: 700 }}
                tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "#999", fontWeight: 700 }}
                tickLine={false} axisLine={false}
                tickFormatter={(v: number) => v >= 100000000 ? `${Math.round(v / 100000000)}억` : v >= 10000 ? `${Math.round(v / 10000)}만` : v > 0 ? String(v) : ""}
                width={weekTotal >= 100000000 ? 56 : 46} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F7F7F7" }} />
              <Bar dataKey="amount" fill="#111111" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
