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
import { getSalesByMonth } from "@/lib/supabase/queries";

// 이전 달 계산
function prevMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

// 다음 달 계산
function nextMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

// 해당 월의 일수 계산
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

interface ChartDataItem {
  day: number;
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
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-[#1C2B3A] px-3 py-2 shadow-lg">
      <p className="text-xs text-[#7A9BB5]">{label}일</p>
      <p className="text-sm font-bold text-white">
        {payload[0].value.toLocaleString("ko-KR")}원
      </p>
    </div>
  );
}

export default function ChartMonthly() {
  const today = new Date();
  const [month, setMonth] = useState<Date>(today);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [monthTotal, setMonthTotal] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const year = month.getFullYear();
        const mon = month.getMonth() + 1;
        const days = daysInMonth(year, mon);

        // 해당 월 전체 일수 배열 초기화 (0원)
        const dataMap: Record<number, number> = {};
        for (let d = 1; d <= days; d++) dataMap[d] = 0;

        const sales = await getSalesByMonth(year, mon);
        sales.forEach((sale) => {
          const day = new Date(sale.date).getDate();
          dataMap[day] = sale.amount;
        });

        const data = Object.entries(dataMap).map(([d, amount]) => ({
          day: Number(d),
          amount,
        }));

        setChartData(data);
        setMonthTotal(sales.reduce((sum, s) => sum + s.amount, 0));
      } catch {
        // 로드 실패 시 빈 데이터 유지
      }
    }
    void fetchData();
  }, [month]);

  const salesDayCount = chartData.filter((d) => d.amount > 0).length;

  return (
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
      </div>

      {/* ── 차트 카드 ── */}
      <div className="mx-4 -mt-4 rounded-2xl bg-white shadow-sm shadow-black/5 overflow-hidden">

        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
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
            {month.getFullYear()}년 {month.getMonth() + 1}월 일별 매출
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

        {/* 막대 차트 */}
        <div className="px-2 pb-6 pt-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                barSize={6}
              >
                <CartesianGrid vertical={false} stroke="#F0EDE8" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "#A0B4C5" }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
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
                  fill="#16A34A"
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
        막대를 탭하면 금액을 확인할 수 있어요
      </p>
    </div>
  );
}
