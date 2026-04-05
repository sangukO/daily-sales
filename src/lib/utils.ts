/** Date → "YYYY-MM-DD" 문자열 변환 */
export function toDateStr(date: Date): string {
  return date.toLocaleDateString("sv-SE");
}

/** 이전 달 첫째 날 */
export function prevMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

/** 다음 달 첫째 날 */
export function nextMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

/** 금액 단축 표기 (억원 / 만원 / 원) */
export function fmtShort(v: number): string {
  if (v >= 100000000) return `${Math.round(v / 100000000)}억원`;
  if (v >= 10000) return `${Math.round(v / 10000)}만원`;
  return `${v.toLocaleString("ko-KR")}원`;
}

export const MONTHS_KO = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];
