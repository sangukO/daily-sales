"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getSalesByRange } from "@/lib/supabase/queries";

interface MonthItem {
  label: string;
  amount: number;
}

// 커스텀 툴팁
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-[#1C2B3A] px-3 py-2 shadow-lg">
      <p className="text-xs text-[#7A9BB5]">{label}</p>
      <p className="text-sm font-bold text-white">
        {payload[0].value.toLocaleString("ko-KR")}원
      </p>
    </div>
  );
}

interface ChartYearlyProps {
  compact?: boolean;
}

export default function ChartYearly({ compact = false }: ChartYearlyProps) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [chartData, setChartData] = useState<MonthItem[]>([]);
  const [yearTotal, setYearTotal] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        const sales = await getSalesByRange(startDate, endDate);

        // 월별 합산
        const monthMap: Record<number, number> = {};
        for (let m = 1; m <= 12; m++) monthMap[m] = 0;
        sales.forEach((sale) => {
          const month = new Date(sale.date).getMonth() + 1;
          monthMap[month] += sale.amount;
        });

        const data: MonthItem[] = Object.entries(monthMap).map(([m, amount]) => ({
          label: `${m}월`,
          amount,
        }));

        setChartData(data);
        setYearTotal(sales.reduce((sum, s) => sum + s.amount, 0));
      } catch {
        // 로드 실패 시 빈 데이터 유지
      }
    }
    void fetchData();
  }, [year]);

  const activeMonthCount = chartData.filter((m) => m.amount > 0).length;

  return (
    <div className="min-h-screen bg-[#F5F3EE]">

      {/* ── 상단 요약 헤더 ── */}
      <div className={`bg-[#1C2B3A] px-6 pb-8 ${compact ? "pt-4" : "pt-14"}`}>
        <p className="text-xs font-medium tracking-widest text-[#7A9BB5] uppercase mb-1">
          {year}년 전체
        </p>
        <p className="text-4xl font-bold text-white leading-none">
          {yearTotal.toLocaleString("ko-KR")}
          <span className="ml-1.5 text-xl font-normal text-[#7A9BB5]">원</span>
        </p>
        <p className="mt-3 text-sm text-[#7A9BB5]">
          {activeMonthCount > 0 ? `${activeMonthCount}개월 기록됨` : "기록된 매출이 없어요"}
        </p>
      </div>

      {/* ── 차트 카드 ── */}
      <div className="mx-4 -mt-4 rounded-2xl bg-white shadow-sm shadow-black/5 overflow-hidden">

        {/* 연도 네비게이션 */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#7A9BB5] hover:bg-[#F5F3EE] transition-colors active:scale-95"
            aria-label="이전 연도"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-sm font-bold text-[#1C2B3A] tracking-tight">
            {year}년 월별 매출
          </span>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#7A9BB5] hover:bg-[#F5F3EE] transition-colors active:scale-95"
            aria-label="다음 연도"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="px-2 pb-6 pt-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                barSize={18}
              >
                <CartesianGrid vertical={false} stroke="#F0EDE8" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#A0B4C5" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#A0B4C5" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) =>
                    v >= 10000 ? `${Math.round(v / 10000)}만` : v > 0 ? String(v) : ""
                  }
                  width={36}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F5F3EE" }} />
                <Bar
                  dataKey="amount"
                  fill="#7C3AED"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-60 items-center justify-center text-sm text-[#A0B4C5]">
              데이터를 불러오는 중...
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 mb-6 text-center text-xs text-[#A0B4C5]">
        막대를 탭하면 월별 합계를 확인할 수 있어요
      </p>
    </div>
  );
}
