"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { getSalesByRange } from "@/lib/supabase/queries";
import { useGoalStore } from "@/store/goalStore";

interface MonthItem { label: string; amount: number; }

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-black px-3 py-2">
      <p className="text-sm text-white/60">{label}</p>
      <p className="text-base font-black text-white tabular-nums">
        {payload[0].value.toLocaleString("ko-KR")}원
      </p>
    </div>
  );
}

interface ChartYearlyProps { compact?: boolean; }

export default function ChartYearly({ compact = false }: ChartYearlyProps) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [chartData, setChartData] = useState<MonthItem[]>([]);
  const [yearTotal, setYearTotal] = useState(0);

  const { yearlyGoal } = useGoalStore();
  const rate = yearlyGoal > 0
    ? Math.min(Math.round((yearTotal / yearlyGoal) * 100), 999)
    : null;

  useEffect(() => {
    async function fetchData() {
      try {
        const sales = await getSalesByRange(`${year}-01-01`, `${year}-12-31`);
        const monthMap: Record<number, number> = {};
        for (let m = 1; m <= 12; m++) monthMap[m] = 0;
        sales.forEach((sale) => {
          monthMap[new Date(sale.date).getMonth() + 1] += sale.amount;
        });
        setChartData(Object.entries(monthMap).map(([m, amount]) => ({ label: `${m}월`, amount })));
        setYearTotal(sales.reduce((sum, s) => sum + s.amount, 0));
      } catch { /* 오류 무시 */ }
    }
    void fetchData();
  }, [year]);

  const activeMonthCount = chartData.filter((m) => m.amount > 0).length;

  return (
    <div className="flex flex-col bg-white h-full">
      <div className={`shrink-0 border-b-2 border-(--gray-5) px-5 pb-4 ${compact ? "pt-4" : "pt-12"}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setYear((y) => y - 1)}
              className="w-11 h-11 flex items-center justify-center text-2xl font-bold text-(--gray-3) active:bg-(--gray-6) rounded">‹</button>
            <h2 className="text-3xl font-black text-black">{year}년</h2>
            <button onClick={() => setYear((y) => y + 1)}
              className="w-11 h-11 flex items-center justify-center text-2xl font-bold text-(--gray-3) active:bg-(--gray-6) rounded">›</button>
          </div>
          <span className="text-sm font-bold text-(--gray-3)">
            {activeMonthCount > 0 ? `${activeMonthCount}개월 기록` : "기록 없음"}
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-4xl font-black text-black tabular-nums">{yearTotal.toLocaleString("ko-KR")}</span>
          <span className="text-xl font-bold text-(--gray-2)">원</span>
        </div>
        {rate !== null && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-bold text-(--gray-3)">연간 목표 달성률</span>
              <span className="text-sm font-black text-black">{rate}%</span>
            </div>
            <div className="h-3 bg-(--gray-5)">
              <div className="h-full bg-black transition-all duration-700"
                style={{ width: `${Math.min(rate, 100)}%` }} />
            </div>
          </div>
        )}
      </div>
      <div className="px-2 pt-3 pb-2">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240} minHeight={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }} barSize={20}>
              <CartesianGrid vertical={false} stroke="#EEEEEE" />
              <XAxis dataKey="label"
                tick={{ fontSize: 11, fill: "#999", fontWeight: 700 }}
                tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "#999", fontWeight: 700 }}
                tickLine={false} axisLine={false}
                tickFormatter={(v: number) => v >= 100000000 ? `${Math.round(v / 100000000)}억` : v >= 10000 ? `${Math.round(v / 10000)}만` : v > 0 ? String(v) : ""}
                width={yearTotal >= 100000000 ? 56 : 46} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F7F7F7" }} />
              <Bar dataKey="amount" fill="#111111" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-60 flex items-center justify-center text-lg font-bold text-(--gray-4)">
            불러오는 중...
          </div>
        )}
      </div>
    </div>
  );
}
