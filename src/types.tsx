export interface Sale {
  id?: number;
  date: Date;
  amount: number;
  memo?: string;
}

export interface ChartData {
  month: string;
  total: number;
}
