// 매출 데이터 타입
export interface Sale {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  memo: string | null;
  created_at: string;
}

// 매출 저장 시 사용하는 타입 (id, created_at 제외)
export type SaleInput = Omit<Sale, "id" | "created_at">;
