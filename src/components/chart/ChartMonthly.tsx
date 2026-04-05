"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { getSalesByMonth } from "@/lib/supabase/queries";
import { useGoalStore } from "@/store/goalStore";
import { prevMonth, nextMonth, MONTHS_KO } from "@/lib/utils";

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

interface ChartDataItem { day: number; amount: number; }

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-black px-3 py-2">
      <p className="text-sm text-white/60">{label}일</p>
      <p className="text-base font-black text-white tabular-nums">
        {payload[0].value.toLocaleString("ko-KR")}원
      </p>
    </div>
  );
}

interface ChartMonthlyProps { compact?: boolean; }

export default function ChartMonthly({ compact = false }: ChartMonthlyProps) {
  const today = new Date();
  const [month, setMonth] = useState<Date>(today);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const { monthlyGoal } = useGoalStore();
  const rate = monthlyGoal > 0
    ? Math.min(Math.round((monthTotal / monthlyGoal) * 100), 999)
    : null;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(false);
    async function fetchData() {
      try {
        const year = month.getFullYear();
        const mon = month.getMonth() + 1;
        const days = daysInMonth(year, mon);
        const dataMap: Record<number, number> = {};
        for (let d = 1; d <= days; d++) dataMap[d] = 0;
        const sales = await getSalesByMonth(year, mon);
        if (cancelled) return;
        sales.forEach((sale) => {
          dataMap[new Date(sale.date).getDate()] = sale.amount;
        });
        setChartData(Object.entries(dataMap).map(([d, amount]) => ({ day: Number(d), amount })));
        setMonthTotal(sales.reduce((sum, s) => sum + s.amount, 0));
      } catch {
        if (!cancelled) setFetchError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchData();
    return () => { cancelled = true; };
  }, [month]);

  const salesDayCount = chartData.filter((d) => d.amount > 0).length;

  return (
    <div className="flex flex-col bg-white h-full">
      {/* 헤더 */}
      <div className={`shrink-0 border-b-2 border-(--gray-5) px-5 pb-4 ${compact ? "pt-4" : "pt-12"}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMonth(prevMonth(month))}
              aria-label="이전 달"
              className="w-11 h-11 flex items-center justify-center text-2xl font-bold text-(--gray-3) active:bg-(--gray-6) rounded">‹</button>
            <h2 className="text-3xl font-black text-black">
              {month.getFullYear()}년 {MONTHS_KO[month.getMonth()]}
            </h2>
            <button
              type="button"
              onClick={() => setMonth(nextMonth(month))}
              aria-label="다음 달"
              className="w-11 h-11 flex items-center justify-center text-2xl font-bold text-(--gray-3) active:bg-(--gray-6) rounded">›</button>
          </div>
          <span className="text-sm font-bold text-(--gray-3)">
            {salesDayCount > 0 ? `${salesDayCount}일 기록` : "기록 없음"}
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-4xl font-black text-black tabular-nums">{monthTotal.toLocaleString("ko-KR")}</span>
          <span className="text-xl font-bold text-(--gray-2)">원</span>
        </div>
        {rate !== null && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-bold text-(--gray-3)">목표 달성률</span>
              <span className="text-sm font-black text-black">{rate}%</span>
            </div>
            <div className="h-3 bg-(--gray-5) rounded-none">
              <div className="h-full bg-black transition-all duration-700"
                style={{ width: `${Math.min(rate, 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* 차트 */}
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
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }} barSize={6}>
              <CartesianGrid vertical={false} stroke="#EEEEEE" />
              <XAxis dataKey="day"
                tick={{ fontSize: 11, fill: "#999", fontWeight: 700 }}
                tickLine={false} axisLine={false} interval={4} />
              <YAxis
                tick={{ fontSize: 11, fill: "#999", fontWeight: 700 }}
                tickLine={false} axisLine={false}
                tickFormatter={(v: number) => v >= 100000000 ? `${Math.round(v / 100000000)}억` : v >= 10000 ? `${Math.round(v / 10000)}만` : v > 0 ? String(v) : ""}
                width={monthTotal >= 100000000 ? 56 : 46} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F7F7F7" }} />
              <Bar dataKey="amount" fill="#111111" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
