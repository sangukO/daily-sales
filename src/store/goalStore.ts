import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GoalState {
  // 월별 목표 금액 (0이면 미설정)
  monthlyGoal: number;
  setMonthlyGoal: (amount: number) => void;
}

export const useGoalStore = create<GoalState>()(
  persist(
    (set) => ({
      monthlyGoal: 0,
      setMonthlyGoal: (amount) => set({ monthlyGoal: amount }),
    }),
    {
      name: "daily-sales-goal",
    }
  )
);
