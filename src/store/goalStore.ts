import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GoalState {
  dailyGoal: number;
  weeklyGoal: number;
  monthlyGoal: number;
  yearlyGoal: number;
  setDailyGoal: (amount: number) => void;
  setWeeklyGoal: (amount: number) => void;
  setMonthlyGoal: (amount: number) => void;
  setYearlyGoal: (amount: number) => void;
  // Supabase에서 불러온 값을 한 번에 반영
  setGoals: (goals: { dailyGoal: number; weeklyGoal: number; monthlyGoal: number; yearlyGoal: number }) => void;
}

export const useGoalStore = create<GoalState>()(
  persist(
    (set) => ({
      dailyGoal: 0,
      weeklyGoal: 0,
      monthlyGoal: 0,
      yearlyGoal: 0,
      setDailyGoal: (amount) => set({ dailyGoal: amount }),
      setWeeklyGoal: (amount) => set({ weeklyGoal: amount }),
      setMonthlyGoal: (amount) => set({ monthlyGoal: amount }),
      setYearlyGoal: (amount) => set({ yearlyGoal: amount }),
      setGoals: (goals) => set(goals),
    }),
    {
      name: "daily-sales-goal", // 기존 키 유지 → monthlyGoal 데이터 자동 호환
    }
  )
);
