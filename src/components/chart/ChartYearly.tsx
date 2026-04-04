"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { getSalesByRange } from "@/lib/supabase/queries";

interface MonthItem { label: string; amount: number; }

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-[#1C1208] px-3 py-2 shadow-lg">
      <p className="text-xs text-[#9E8E7A]">{label}</p>
      <p className="font-(family-name:--font-playfair) text-sm font-semibold text-white">
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
      } catch {
        // 로드 실패 시 빈 데이터 유지
      }
    }
    void fetchData();
  }, [year]);

  const activeMonthCount = chartData.filter((m) => m.amount > 0).length;

  return (
    <div className="min-h-screen bg-[#FAF7F0]">

      {/* ── 헤더 ── */}
      <div className={`px-6 pb-6 ${compact ? "pt-5" : "pt-14"}`}>
        <p className="text-xs font-semibold tracking-[0.2em] text-[#9E8E7A] uppercase mb-3">
          {year}년 전체
        </p>
        <div className="mb-1">
          <span className="font-(family-name:--font-playfair) text-4xl font-bold leading-none text-[#1C1208]">
            {yearTotal.toLocaleString("ko-KR")}
          </span>
          <span className="ml-2 text-base font-medium text-[#9E8E7A]">원</span>
        </div>
        <p className="text-sm text-[#9E8E7A]">
          {activeMonthCount > 0 ? `${activeMonthCount}개월 기록됨` : "기록된 매출이 없어요"}
        </p>
      </div>

      <div className="mx-6 border-t border-[#DDD3C2]" />

      {/* ── 차트 ── */}
      <div className="mx-4 mt-4 rounded-2xl bg-white shadow-sm shadow-black/5 overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#9E8E7A] hover:bg-[#EDE5D8] transition-colors active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-[#1C1208]">
            {year}년 월별 매출
          </span>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#9E8E7A] hover:bg-[#EDE5D8] transition-colors active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="px-2 pb-6 pt-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={18}>
                <CartesianGrid vertical={false} stroke="#EDE5D8" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#C8BAA8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#C8BAA8" }} tickLine={false} axisLine={false}
                  tickFormatter={(v: number) => v >= 10000 ? `${Math.round(v / 10000)}만` : v > 0 ? String(v) : ""}
                  width={36} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#FDF3E1" }} />
                <Bar dataKey="amount" fill="#B5732A" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-56 items-center justify-center text-sm text-[#C8BAA8]">
              데이터를 불러오는 중...
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 mb-6 text-center text-xs text-[#C8BAA8]">
        막대를 탭하면 월별 합계를 확인할 수 있어요
      </p>
    </div>
  );
}
