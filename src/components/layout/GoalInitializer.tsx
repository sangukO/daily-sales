"use client";

import { useEffect } from "react";
import { getGoalSettings } from "@/lib/supabase/queries";
import { useGoalStore } from "@/store/goalStore";

// 앱 시작 시 Supabase에서 목표 설정을 한 번 동기화
export default function GoalInitializer() {
  const setGoals = useGoalStore((s) => s.setGoals);

  useEffect(() => {
    getGoalSettings()
      .then((settings) => {
        if (settings) setGoals(settings);
      })
      .catch(() => {
        // 실패 시 localStorage 값 유지
      });
  }, [setGoals]);

  return null;
}
