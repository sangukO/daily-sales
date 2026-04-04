"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { getSalesByRange } from "@/lib/supabase/queries";

function toDateStr(date: Date): string {
  return date.toLocaleDateString("sv-SE");
}
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

interface WeekItem { label: string; amount: number; weekStart: string; }

function buildWeeks(count: number): WeekItem[] {
  const thisWeekStart = getWeekStart(new Date());
  const weeks: WeekItem[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const start = new Date(thisWeekStart);
    start.setDate(start.getDate() - i * 7);
    weeks.push({
      label: `${start.getMonth() + 1}/${start.getDate()}`,
      amount: 0,
      weekStart: toDateStr(start),
    });
  }
  return weeks;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-[#1C1208] px-3 py-2 shadow-lg">
      <p className="text-xs text-[#9E8E7A]">{label}주</p>
      <p className="font-(family-name:--font-playfair) text-sm font-semibold text-white">
        {payload[0].value.toLocaleString("ko-KR")}원
      </p>
    </div>
  );
}

const WEEK_COUNT = 12;
interface ChartWeeklyProps { compact?: boolean; }

export default function ChartWeekly({ compact = false }: ChartWeeklyProps) {
  const [chartData, setChartData] = useState<WeekItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const weeks = buildWeeks(WEEK_COUNT);
        const startDate = weeks[0].weekStart;
        const lastWeekStart = new Date(weeks[weeks.length - 1].weekStart);
        const endDate = toDateStr(new Date(lastWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000));
        const sales = await getSalesByRange(startDate, endDate);
        const weekMap: Record<string, number> = {};
        weeks.forEach((w) => { weekMap[w.weekStart] = 0; });
        sales.forEach((sale) => {
          const weekStart = toDateStr(getWeekStart(new Date(sale.date)));
          if (weekStart in weekMap) weekMap[weekStart] += sale.amount;
        });
        setChartData(weeks.map((w) => ({ ...w, amount: weekMap[w.weekStart] })));
        setTotalAmount(sales.reduce((sum, s) => sum + s.amount, 0));
      } catch {
        // 로드 실패 시 빈 데이터 유지
      }
    }
    void fetchData();
  }, []);

  const activeWeekCount = chartData.filter((w) => w.amount > 0).length;

  return (
    <div className="min-h-screen bg-[#FAF7F0]">

      {/* ── 헤더 ── */}
      <div className={`px-6 pb-6 ${compact ? "pt-5" : "pt-14"}`}>
        <p className="text-xs font-semibold tracking-[0.2em] text-[#9E8E7A] uppercase mb-3">
          최근 {WEEK_COUNT}주
        </p>
        <div className="mb-1">
          <span className="font-(family-name:--font-playfair) text-4xl font-bold leading-none text-[#1C1208]">
            {totalAmount.toLocaleString("ko-KR")}
          </span>
          <span className="ml-2 text-base font-medium text-[#9E8E7A]">원</span>
        </div>
        <p className="text-sm text-[#9E8E7A]">
          {activeWeekCount > 0 ? `${activeWeekCount}주 기록됨` : "기록된 매출이 없어요"}
        </p>
      </div>

      <div className="mx-6 border-t border-[#DDD3C2]" />

      {/* ── 차트 ── */}
      <div className="mx-4 mt-4 rounded-2xl bg-white shadow-sm shadow-black/5 overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <span className="text-sm font-semibold text-[#1C1208]">주별 매출</span>
        </div>
        <div className="px-2 pb-6 pt-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={14}>
                <CartesianGrid vertical={false} stroke="#EDE5D8" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#C8BAA8" }} tickLine={false} axisLine={false} interval={2} />
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
        막대를 탭하면 주간 합계를 확인할 수 있어요
      </p>
    </div>
  );
}
