"use client";

import { useState } from "react";
import ChartWeekly from "@/components/chart/ChartWeekly";
import ChartMonthly from "@/components/chart/ChartMonthly";
import ChartYearly from "@/components/chart/ChartYearly";

type Tab = "weekly" | "monthly" | "yearly";

const tabs: { key: Tab; label: string }[] = [
  { key: "weekly", label: "주간" },
  { key: "monthly", label: "월간" },
  { key: "yearly", label: "연간" },
];

export default function ChartPage() {
  const [activeTab, setActiveTab] = useState<Tab>("monthly");

  return (
    <div>
      {/* 탭 바 */}
      <div className="sticky top-0 z-10 bg-[#1C2B3A] px-4 pt-12 pb-0">
        <div className="flex">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={[
                "flex-1 py-3 text-sm font-semibold tracking-wide transition-colors",
                activeTab === key
                  ? "border-b-2 border-white text-white"
                  : "border-b-2 border-transparent text-[#7A9BB5]",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === "weekly" && <ChartWeekly compact />}
      {activeTab === "monthly" && <ChartMonthly compact />}
      {activeTab === "yearly" && <ChartYearly compact />}
    </div>
  );
}
