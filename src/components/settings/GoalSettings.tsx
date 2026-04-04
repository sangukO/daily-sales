"use client";

import { useState, useEffect } from "react";
import { useGoalStore } from "@/store/goalStore";
import { getGoalSettings, upsertGoalSettings } from "@/lib/supabase/queries";

function fmt(value: string): string {
  const numeric = value.replace(/[^0-9]/g, "");
  if (!numeric) return "";
  return Number(numeric).toLocaleString("ko-KR");
}
function parse(value: string): number {
  return Number(value.replace(/,/g, "")) || 0;
}

interface GoalRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}

function GoalRow({ label, value, onChange, hint }: GoalRowProps) {
  return (
    <div className="flex items-center border-b-2 border-(--gray-5) py-4 gap-4">
      <label className="w-20 shrink-0 text-xl font-black text-black">{label}</label>
      <div className="flex-1">
        <div className="relative border-2 border-(--gray-4) focus-within:border-black transition-colors flex items-center">
          <input
            type="text"
            inputMode="numeric"
            value={value}
            onChange={(e) => onChange(fmt(e.target.value))}
            placeholder="0"
            className="w-full bg-white px-4 py-3 pr-10 text-right text-2xl font-black text-black placeholder-(--gray-4) focus:outline-none tabular-nums"
          />
          <span className="absolute right-3 text-base font-bold text-(--gray-3) pointer-events-none">원</span>
        </div>
        {hint && <p className="text-xs text-(--gray-3) mt-1 text-right">{hint}</p>}
      </div>
    </div>
  );
}

export default function GoalSettings() {
  const { dailyGoal, weeklyGoal, monthlyGoal, yearlyGoal,
    setDailyGoal, setWeeklyGoal, setMonthlyGoal, setYearlyGoal, setGoals } = useGoalStore();

  const [dailyVal,   setDailyVal]   = useState(dailyGoal   > 0 ? dailyGoal.toLocaleString("ko-KR")   : "");
  const [weeklyVal,  setWeeklyVal]  = useState(weeklyGoal  > 0 ? weeklyGoal.toLocaleString("ko-KR")  : "");
  const [monthlyVal, setMonthlyVal] = useState(monthlyGoal > 0 ? monthlyGoal.toLocaleString("ko-KR") : "");
  const [yearlyVal,  setYearlyVal]  = useState(yearlyGoal  > 0 ? yearlyGoal.toLocaleString("ko-KR")  : "");
  const [saved,      setSaved]      = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState(false);
  const [monthlyAutoCalced, setMonthlyAutoCalced] = useState(false);
  const [yearlyAutoCalced,  setYearlyAutoCalced]  = useState(false);

  // 설정 화면 진입 시 Supabase에서 최신 목표 동기화
  useEffect(() => {
    getGoalSettings()
      .then((settings) => {
        if (settings) {
          setGoals(settings);
          setDailyVal(settings.dailyGoal   > 0 ? settings.dailyGoal.toLocaleString("ko-KR")   : "");
          setWeeklyVal(settings.weeklyGoal  > 0 ? settings.weeklyGoal.toLocaleString("ko-KR")  : "");
          setMonthlyVal(settings.monthlyGoal > 0 ? settings.monthlyGoal.toLocaleString("ko-KR") : "");
          setYearlyVal(settings.yearlyGoal  > 0 ? settings.yearlyGoal.toLocaleString("ko-KR")  : "");
        }
      })
      .catch(() => {
        // 실패 시 localStorage 값 그대로 유지
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDailyChange(v: string) {
    setDailyVal(v);
    const daily = parse(v);
    if (daily > 0) {
      if (parse(monthlyVal) === 0 || monthlyAutoCalced) {
        setMonthlyVal(fmt(String(daily * 25)));
        setMonthlyAutoCalced(true);
      }
      if (parse(yearlyVal) === 0 || yearlyAutoCalced) {
        setYearlyVal(fmt(String(daily * 25 * 12)));
        setYearlyAutoCalced(true);
      }
    } else {
      if (monthlyAutoCalced) { setMonthlyVal(""); setMonthlyAutoCalced(false); }
      if (yearlyAutoCalced)  { setYearlyVal("");  setYearlyAutoCalced(false); }
    }
  }

  async function handleSave() {
    const goals = {
      dailyGoal:   parse(dailyVal),
      weeklyGoal:  parse(weeklyVal),
      monthlyGoal: parse(monthlyVal),
      yearlyGoal:  parse(yearlyVal),
    };
    setSaving(true); setSaveError(false);
    try {
      await upsertGoalSettings(goals);
      setDailyGoal(goals.dailyGoal); setWeeklyGoal(goals.weeklyGoal);
      setMonthlyGoal(goals.monthlyGoal); setYearlyGoal(goals.yearlyGoal);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveError(true);
      setTimeout(() => setSaveError(false), 3000);
    } finally { setSaving(false); }
  }

  function handleClear() {
    setDailyVal(""); setWeeklyVal(""); setMonthlyVal(""); setYearlyVal("");
    setDailyGoal(0); setWeeklyGoal(0); setMonthlyGoal(0); setYearlyGoal(0);
    setMonthlyAutoCalced(false); setYearlyAutoCalced(false);
    setSaved(false);
  }

  const hasAny = dailyGoal > 0 || weeklyGoal > 0 || monthlyGoal > 0 || yearlyGoal > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 py-2">
        <GoalRow label="하루"   value={dailyVal}   onChange={handleDailyChange} />
        <GoalRow label="일주일" value={weeklyVal}  onChange={setWeeklyVal} />
        <GoalRow
          label="한 달"
          value={monthlyVal}
          onChange={(v) => { setMonthlyVal(v); setMonthlyAutoCalced(false); }}
          hint={monthlyAutoCalced ? "자동 계산됨 (하루 × 25)" : undefined}
        />
        <GoalRow
          label="일 년"
          value={yearlyVal}
          onChange={(v) => { setYearlyVal(v); setYearlyAutoCalced(false); }}
          hint={yearlyAutoCalced ? "자동 계산됨 (한 달 × 12)" : undefined}
        />
      </div>

      {saveError && (
        <p className="px-5 py-3 text-base font-bold text-(--cal-sun) border-t-2 border-(--cal-sun) bg-(--red-bg)">
          저장에 실패했습니다. 다시 시도해주세요.
        </p>
      )}

      <div className="shrink-0 border-t-4 border-black flex">
        {hasAny && (
          <button
            onClick={handleClear}
            className="px-6 py-5 text-lg font-black text-(--gray-3) border-r-2 border-black active:bg-(--gray-5) transition-colors"
          >
            초기화
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-5 text-xl font-black bg-black text-white active:opacity-70 disabled:opacity-50 transition-opacity"
        >
          {saving ? "저장 중..." : saved ? "저장됨 ✓" : "저장하기"}
        </button>
      </div>
    </div>
  );
}
