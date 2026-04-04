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

// 날짜를 YYYY-MM-DD 문자열로 변환
function toDateStr(date: Date): string {
  return date.toLocaleDateString("sv-SE");
}

// 주의 시작(월요일) 날짜 계산
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=일, 1=월
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

interface WeekItem {
  label: string; // "3/24" 형식
  amount: number;
  weekStart: string;
}

// 최근 N주 데이터 구조 생성
function buildWeeks(count: number): WeekItem[] {
  const thisWeekStart = getWeekStart(new Date());
  const weeks: WeekItem[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const start = new Date(thisWeekStart);
    start.setDate(start.getDate() - i * 7);
    const month = start.getMonth() + 1;
    const day = start.getDate();
    weeks.push({
      label: `${month}/${day}`,
      amount: 0,
      weekStart: toDateStr(start),
    });
  }
  return weeks;
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
      <p className="text-xs text-[#7A9BB5]">{label}주</p>
      <p className="text-sm font-bold text-white">
        {payload[0].value.toLocaleString("ko-KR")}원
      </p>
    </div>
  );
}

const WEEK_COUNT = 12;

interface ChartWeeklyProps {
  compact?: boolean;
}

export default function ChartWeekly({ compact = false }: ChartWeeklyProps) {
  const [chartData, setChartData] = useState<WeekItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const weeks = buildWeeks(WEEK_COUNT);
        const startDate = weeks[0].weekStart;
        const lastWeekStart = new Date(weeks[weeks.length - 1].weekStart);
        const endDate = toDateStr(
          new Date(lastWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
        );

        const sales = await getSalesByRange(startDate, endDate);

        // 각 매출을 해당 주에 배분
        const weekMap: Record<string, number> = {};
        weeks.forEach((w) => { weekMap[w.weekStart] = 0; });

        sales.forEach((sale) => {
          const saleDate = new Date(sale.date);
          const weekStart = toDateStr(getWeekStart(saleDate));
          if (weekStart in weekMap) {
            weekMap[weekStart] += sale.amount;
          }
        });

        const data = weeks.map((w) => ({
          ...w,
          amount: weekMap[w.weekStart],
        }));

        setChartData(data);
        setTotalAmount(sales.reduce((sum, s) => sum + s.amount, 0));
      } catch {
        // 로드 실패 시 빈 데이터 유지
      }
    }
    void fetchData();
  }, []);

  const activeWeekCount = chartData.filter((w) => w.amount > 0).length;

  return (
    <div className="min-h-screen bg-[#F5F3EE]">

      {/* ── 상단 요약 헤더 ── */}
      <div className={`bg-[#1C2B3A] px-6 pb-8 ${compact ? "pt-4" : "pt-14"}`}>
        <p className="text-xs font-medium tracking-widest text-[#7A9BB5] uppercase mb-1">
          최근 {WEEK_COUNT}주
        </p>
        <p className="text-4xl font-bold text-white leading-none">
          {totalAmount.toLocaleString("ko-KR")}
          <span className="ml-1.5 text-xl font-normal text-[#7A9BB5]">원</span>
        </p>
        <p className="mt-3 text-sm text-[#7A9BB5]">
          {activeWeekCount > 0 ? `${activeWeekCount}주 기록됨` : "기록된 매출이 없어요"}
        </p>
      </div>

      {/* ── 차트 카드 ── */}
      <div className="mx-4 -mt-4 rounded-2xl bg-white shadow-sm shadow-black/5 overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <span className="text-sm font-bold text-[#1C2B3A] tracking-tight">
            주별 매출
          </span>
        </div>

        <div className="px-2 pb-6 pt-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                barSize={14}
              >
                <CartesianGrid vertical={false} stroke="#F0EDE8" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#A0B4C5" }}
                  tickLine={false}
                  axisLine={false}
                  interval={2}
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
                  fill="#2563EB"
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
        막대를 탭하면 주간 합계를 확인할 수 있어요
      </p>
    </div>
  );
}
