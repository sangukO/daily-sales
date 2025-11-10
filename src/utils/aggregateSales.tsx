import type { Sale } from "@/types";
import type { ChartData } from "@/types";

export function aggregateSalesByMonth(
  sales: Sale[],
  year: number
): ChartData[] {
  // 월별 합계를 저장할 객체
  const monthlyTotals: { [key: number]: number } = {};

  // 매출 데이터 순회
  sales.forEach((sale) => {
    // 해당 매출이 목표 연도와 일치하는지 확인
    if (sale.date.getFullYear() === year) {
      const month = sale.date.getMonth();

      // 해당 월에 매출액 더하기
      if (!monthlyTotals[month]) {
        monthlyTotals[month] = 0;
      }

      monthlyTotals[month] += sale.amount;
    }
  });

  // 차트 라이브러리 형식으로 변환
  const chartData: ChartData[] = Array.from({ length: 12 }, (_, i) => {
    const monthName = new Date(year, i).toLocaleString("ko-KR", {
      month: "long",
    });
    return {
      month: monthName,
      total: monthlyTotals[i] || 0, // 해당 월의 매출이 없으면 0으로 처리
    };
  });

  return chartData;
}
