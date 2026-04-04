import { createClient } from "./client";
import type { Sale, SaleInput } from "@/types";

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

  // RLS 정책(auth.uid() = user_id) 충족을 위해 현재 유저 id 포함
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("sales")
    .upsert({ ...sale, user_id: user?.id })
    .select()
    .single();

  if (error) throw error;
  return data;
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
