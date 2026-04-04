"use client";

import { useState } from "react";
import ChartWeekly from "@/components/chart/ChartWeekly";
import ChartMonthly from "@/components/chart/ChartMonthly";
import ChartYearly from "@/components/chart/ChartYearly";

type Tab = "weekly" | "monthly" | "yearly";

const tabs: { key: Tab; label: string }[] = [
  { key: "weekly",  label: "주간" },
  { key: "monthly", label: "월간" },
  { key: "yearly",  label: "연간" },
];

export default function ChartPage() {
  const [activeTab, setActiveTab] = useState<Tab>("monthly");

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 탭 바 */}
      <div className="shrink-0 flex border-b-4 border-black pt-10">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={[
              "flex-1 py-4 text-xl font-black transition-colors border-r-2 border-black last:border-r-0",
              activeTab === key
                ? "bg-black text-white"
                : "text-(--gray-3) bg-white active:bg-(--gray-6)",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "weekly"  && <ChartWeekly compact />}
        {activeTab === "monthly" && <ChartMonthly compact />}
        {activeTab === "yearly"  && <ChartYearly compact />}
      </div>
    </div>
  );
}
