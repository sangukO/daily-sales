import { createClient } from "./client";
import type { Sale, SaleInput } from "@/types";

// 월별 매출 조회
export async function getSalesByMonth(year: number, month: number): Promise<Sale[]> {
  const supabase = createClient();
  const mm = String(month).padStart(2, "0");
  const startDate = `${year}-${mm}-01`;
  const endDate = `${year}-${mm}-31`;

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

  const { data, error } = await supabase
    .from("sales")
    .upsert(sale)
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
