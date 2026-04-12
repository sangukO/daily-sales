import { createClient } from "./client";
import type { Sale, SaleInput } from "@/types";

// ── 목표 설정 타입 ──────────────────────────────────────────
export interface GoalSettings {
  dailyGoal: number;
  weeklyGoal: number;
  monthlyGoal: number;
  yearlyGoal: number;
}

// 월별 매출 조회
export async function getSalesByMonth(year: number, month: number): Promise<Sale[]> {
  const supabase = createClient();
  const mm = String(month).padStart(2, "0");
  const startDate = `${year}-${mm}-01`;
  // 해당 월의 실제 마지막 날 계산 (4월=30일, 2월=28/29일 등)
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${mm}-${String(lastDay).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// 연도별 매출 총합 조회
export async function getSalesByYear(year: number): Promise<number> {
  const supabase = createClient();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const { data, error } = await supabase
    .from("sales")
    .select("amount")
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + row.amount, 0);
}

// 날짜 범위 매출 조회 (주간/연간 차트용)
export async function getSalesByRange(startDate: string, endDate: string): Promise<Sale[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// 매출 저장 (신규 생성 또는 수정)
export async function upsertSale(sale: SaleInput & { id?: string }): Promise<Sale> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (sale.id) {
    // 기존 레코드 수정: id는 조건에만 사용하고 payload에서 제외
    const { id, ...payload } = sale;
    const { data, error } = await supabase
      .from("sales")
      .update({ ...payload, user_id: user?.id })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("sales")
      .insert({ ...sale, user_id: user?.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// ── 목표 설정 조회 ──────────────────────────────────────────
export async function getGoalSettings(): Promise<GoalSettings | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_settings")
    .select("daily_goal, weekly_goal, monthly_goal, yearly_goal")
    .eq("user_id", user.id)
    .single();

  if (error) {
    // 행이 없는 경우(PGRST116)는 null 반환, 그 외 에러는 throw
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return {
    dailyGoal: data.daily_goal,
    weeklyGoal: data.weekly_goal,
    monthlyGoal: data.monthly_goal,
    yearlyGoal: data.yearly_goal,
  };
}

// ── 목표 설정 저장 ──────────────────────────────────────────
export async function upsertGoalSettings(settings: GoalSettings): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const { error } = await supabase
    .from("user_settings")
    .upsert({
      user_id: user.id,
      daily_goal: settings.dailyGoal,
      weekly_goal: settings.weeklyGoal,
      monthly_goal: settings.monthlyGoal,
      yearly_goal: settings.yearlyGoal,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
}

// ── 푸시 알림 설정 조회 (클라이언트 전용) ──────────────────────────────

export interface NotificationConfig {
  notificationHour: number | null;
  hasSubscription: boolean;
}

export async function getNotificationSettings(): Promise<NotificationConfig> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { notificationHour: null, hasSubscription: false };

  const { data, error } = await supabase
    .from("user_settings")
    .select("notification_hour, push_endpoint")
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return { notificationHour: null, hasSubscription: false };
    throw error;
  }

  return {
    notificationHour: data.notification_hour ?? null,
    hasSubscription: !!data.push_endpoint,
  };
}

// 매출 삭제
export async function deleteSale(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("sales")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// 전체 매출 조회 (JSON 내보내기용)
export async function getAllSales(): Promise<Sale[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .order("date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
