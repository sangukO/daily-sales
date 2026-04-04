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
      <div className="sticky top-0 z-10 bg-[#FAF7F0] border-b border-[#DDD3C2] px-4 pt-12">
        <div className="flex">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={[
                "flex-1 pb-3 pt-1 text-sm font-semibold tracking-wide transition-colors",
                activeTab === key
                  ? "border-b-2 border-[#B5732A] text-[#B5732A]"
                  : "border-b-2 border-transparent text-[#C8BAA8] hover:text-[#9E8E7A]",
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
