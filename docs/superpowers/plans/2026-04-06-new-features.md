# 신규 기능 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 7개 신규 기능 구현 — +증가 버튼, 휴무일 구분, 전월 대비, 오늘로 이동, 메모 검색, 요일별 평균, JSON 백업/복원

**Architecture:** 각 기능은 독립적으로 구현. DB 마이그레이션(Task 1)이 선행되어야 하며, 이후 Task 2~8은 순서대로 구현. 설정 페이지는 Task 7에서 스크롤 구조로 리팩토링.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS v4, Supabase, Recharts

---

### Task 1: DB 마이그레이션 + 타입/쿼리 업데이트

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/supabase/queries.ts`

- [ ] **Step 1: Supabase 대시보드에서 is_holiday 컬럼 추가**

Supabase 프로젝트 → SQL Editor → 다음 실행:

```sql
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS is_holiday boolean NOT NULL DEFAULT false;
```

- [ ] **Step 2: Sale 타입에 is_holiday 추가**

`src/types/index.ts` 전체 교체:

```typescript
// 매출 데이터 타입
export interface Sale {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  memo: string | null;
  is_holiday: boolean;
  created_at: string;
}

// 매출 저장 시 사용하는 타입 (id, created_at 제외)
export type SaleInput = Omit<Sale, "id" | "created_at">;
```

- [ ] **Step 3: getAllSales 함수 추가 (JSON 내보내기용)**

`src/lib/supabase/queries.ts` 의 `deleteSale` 아래에 추가:

```typescript
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
```

- [ ] **Step 4: 검증**

```bash
npx tsc --noEmit && npm run lint
```

기대 결과: 오류 없음

- [ ] **Step 5: 커밋**

```bash
git add src/types/index.ts src/lib/supabase/queries.ts
git commit -m "feat: is_holiday 컬럼 추가 및 타입/쿼리 업데이트"
```

---

### Task 2: +증가 버튼 (SalesDayDialog)

**Files:**
- Modify: `src/components/calendar/SalesDayDialog.tsx`

- [ ] **Step 1: 금액 입력 섹션에 버튼 추가**

`src/components/calendar/SalesDayDialog.tsx` 의 `<CurrencyInput ... />` 바로 아래에 추가:

```tsx
            {/* 빠른 금액 추가 버튼 */}
            <div className="flex gap-2 mt-2">
              {[100000, 300000, 500000].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAmount((prev) => prev + n)}
                  className="flex-1 border-2 border-black py-3 text-sm font-black active:bg-(--gray-5) transition-colors"
                >
                  +{n / 10000}만
                </button>
              ))}
            </div>
```

- [ ] **Step 2: 검증**

```bash
npx tsc --noEmit && npm run lint
```

기대 결과: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/calendar/SalesDayDialog.tsx
git commit -m "feat: 매출 입력 다이얼로그에 +증가 버튼 추가"
```

---

### Task 3: 오늘로 돌아오기 버튼 (SalesCalendar)

**Files:**
- Modify: `src/components/calendar/SalesCalendar.tsx`

- [ ] **Step 1: 월 네비게이션 아래에 버튼 추가**

`src/components/calendar/SalesCalendar.tsx` 에서 `{/* 월 매출 요약 행 */}` 주석 바로 위에 추가:

```tsx
          {/* 오늘로 돌아오기 — 현재 달이 아닐 때만 표시 */}
          {!isCurrentMonth && (
            <div className="flex justify-center py-1.5 border-b border-(--gray-4)">
              <button
                type="button"
                onClick={() => setMonth(new Date())}
                className="border-2 border-black px-5 py-1.5 text-sm font-black active:bg-(--gray-5) transition-colors"
              >
                오늘로
              </button>
            </div>
          )}
```

- [ ] **Step 2: 검증**

```bash
npx tsc --noEmit && npm run lint
```

기대 결과: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/components/calendar/SalesCalendar.tsx
git commit -m "feat: 캘린더에 오늘로 돌아오기 버튼 추가"
```

---

### Task 4: 휴무일 구분 (SalesDayDialog + SalesCalendar)

**Files:**
- Modify: `src/components/calendar/SalesDayDialog.tsx`
- Modify: `src/components/calendar/SalesCalendar.tsx`

- [ ] **Step 1: SalesDayDialog에 탭 상태 추가 및 초기값 설정**

`src/components/calendar/SalesDayDialog.tsx` 에서 기존 state 선언부에 추가:

```tsx
  const [mode, setMode] = useState<"sales" | "holiday">(
    existingSale?.is_holiday ? "holiday" : "sales"
  );
```

- [ ] **Step 2: 다이얼로그 헤더 아래에 탭 UI 추가**

헤더 `</div>` (닫기 버튼 포함하는 div) 바로 아래, `<div className="px-5 pb-8 pt-5 space-y-6">` 바로 위에 추가:

```tsx
        {/* 모드 탭 */}
        <div className="flex border-b-2 border-black">
          <button
            type="button"
            onClick={() => setMode("sales")}
            className={`flex-1 py-3 text-sm font-black transition-colors ${
              mode === "sales"
                ? "bg-black text-white"
                : "bg-white text-black active:bg-(--gray-5)"
            }`}
          >
            매출 입력
          </button>
          <button
            type="button"
            onClick={() => setMode("holiday")}
            className={`flex-1 py-3 text-sm font-black transition-colors ${
              mode === "holiday"
                ? "bg-black text-white"
                : "bg-white text-black active:bg-(--gray-5)"
            }`}
          >
            휴무일
          </button>
        </div>
```

- [ ] **Step 3: 모드에 따라 콘텐츠 조건부 렌더링**

`<div className="px-5 pb-8 pt-5 space-y-6">` 내부 전체를 다음으로 교체:

```tsx
          {mode === "holiday" ? (
            /* 휴무일 모드 */
            <div className="py-4">
              <p className="text-base font-bold text-(--gray-2) mb-4">
                이 날을 휴무일로 기록합니다.
              </p>
              {/* 메모 (휴무 이유 등) */}
              <div>
                <label className="block text-base font-black text-black mb-3">
                  메모{" "}
                  <span className="text-sm font-normal text-(--gray-3)">(선택사항)</span>
                </label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="휴무 이유를 입력하세요 (예: 추석, 공휴일)"
                  rows={2}
                  className="w-full resize-none border-2 border-(--gray-4) rounded-none bg-white px-4 py-3 text-lg text-black placeholder-(--gray-4) focus:outline-none focus:border-black transition-colors"
                />
              </div>
              {error && (
                <p className="text-base font-bold text-(--cal-sun) border-l-4 border-(--cal-sun) pl-4 mt-4">
                  {error}
                </p>
              )}
              <div className="flex gap-3 pt-4">
                {existingSale && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="border-2 border-black px-5 py-4 text-base font-black text-black active:bg-(--gray-5) disabled:opacity-40 transition-colors"
                  >
                    삭제
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-black py-4 text-lg font-black text-white active:opacity-70 disabled:opacity-40 transition-opacity"
                >
                  {loading ? "저장 중..." : "휴무일 저장"}
                </button>
              </div>
            </div>
          ) : (
            /* 매출 입력 모드 */
            <>
              {/* 금액 입력 */}
              <div>
                <label className="block text-base font-black text-black mb-3">
                  매출액
                </label>
                <CurrencyInput value={amount} onChange={setAmount} placeholder="0" />
                {/* 빠른 금액 추가 버튼 */}
                <div className="flex gap-2 mt-2">
                  {[100000, 300000, 500000].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAmount((prev) => prev + n)}
                      className="flex-1 border-2 border-black py-3 text-sm font-black active:bg-(--gray-5) transition-colors"
                    >
                      +{n / 10000}만
                    </button>
                  ))}
                </div>
              </div>
              {/* 메모 */}
              <div>
                <label className="block text-base font-black text-black mb-3">
                  메모{" "}
                  <span className="text-sm font-normal text-(--gray-3)">(선택사항)</span>
                </label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="간단한 메모를 입력하세요"
                  rows={2}
                  className="w-full resize-none border-2 border-(--gray-4) rounded-none bg-white px-4 py-3 text-lg text-black placeholder-(--gray-4) focus:outline-none focus:border-black transition-colors"
                />
              </div>
              {error && (
                <p className="text-base font-bold text-(--cal-sun) border-l-4 border-(--cal-sun) pl-4">
                  {error}
                </p>
              )}
              <div className="flex gap-3 pt-1">
                {existingSale && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="border-2 border-black px-5 py-4 text-base font-black text-black active:bg-(--gray-5) disabled:opacity-40 transition-colors"
                  >
                    삭제
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-black py-4 text-lg font-black text-white active:opacity-70 disabled:opacity-40 transition-opacity"
                >
                  {loading ? "저장 중..." : "저장하기"}
                </button>
              </div>
            </>
          )}
```

> **주의:** Task 2에서 추가한 +증가 버튼이 이 step에서 매출 입력 모드 콘텐츠 안에 통합됩니다. Task 2의 변경은 이 Step에서 덮어쓰게 됩니다.

- [ ] **Step 4: handleSave에서 is_holiday 포함**

`handleSave` 함수를 다음으로 교체:

```typescript
  async function handleSave() {
    if (mode === "sales" && amount <= 0) {
      setError("금액을 입력해주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await upsertSale({
        ...(existingSale?.id ? { id: existingSale.id } : {}),
        date: date.toLocaleDateString("sv-SE"),
        amount: mode === "holiday" ? 0 : amount,
        memo: memo.trim() || null,
        is_holiday: mode === "holiday",
      });
      onSaved();
      handleClose();
    } catch {
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }
```

- [ ] **Step 5: SalesCalendar에서 캘린더 셀에 "휴" 표시 + 통계 제외**

`src/components/calendar/SalesCalendar.tsx` 에서:

**salesDayCount 계산 변경** (휴무일 제외):
```typescript
  const salesDayCount = Object.values(salesMap).filter(
    (s) => !s.is_holiday
  ).length;
```

**DayButton 내부 bgClass 결정 로직** 에서 휴무일 처리 추가 (isSelected 체크 바로 아래):
```typescript
                  if (isSelected) {
                    bgClass = "bg-black";
                  } else if (sale?.is_holiday) {
                    bgClass = "bg-(--gray-6)"; // 휴무일: 회색
                  } else if (isToday) {
```

**DayButton 내부 금액 표시 부분** 에서 휴무일일 때 "휴" 표시:
```tsx
                      {/* 매출 금액 또는 휴무 표시 */}
                      {sale && !isOutside && (
                        sale.is_holiday ? (
                          <span className="text-[10px] font-bold leading-tight mt-0.5 text-(--gray-3)">
                            휴
                          </span>
                        ) : amountStr ? (
                          <span
                            className={[
                              "text-[10px] font-bold leading-tight mt-0.5",
                              isSelected
                                ? "text-white/90"
                                : dailyGoal > 0 &&
                                    isPastOrToday &&
                                    sale.amount < dailyGoal
                                  ? "text-(--cal-sun)"
                                  : "text-(--gray-1)",
                            ].join(" ")}
                          >
                            {amountStr}
                          </span>
                        ) : null
                      )}
```

> **주의:** 기존 `{amountStr && (...)}` 블록 전체를 위 코드로 교체합니다.

- [ ] **Step 6: 검증**

```bash
npx tsc --noEmit && npm run lint
```

기대 결과: 오류 없음

- [ ] **Step 7: 커밋**

```bash
git add src/components/calendar/SalesDayDialog.tsx src/components/calendar/SalesCalendar.tsx
git commit -m "feat: 휴무일 구분 기능 추가 (탭 토글, 캘린더 표시, 통계 제외)"
```

---

### Task 5: 전월 대비 비교 (SalesCalendar)

**Files:**
- Modify: `src/components/calendar/SalesCalendar.tsx`

- [ ] **Step 1: 전월 비교 상태 추가**

기존 state 선언부 (`const [weekTotal, setWeekTotal]` 아래)에 추가:

```typescript
  const [prevMonthTotal, setPrevMonthTotal] = useState<number | null>(null);
```

- [ ] **Step 2: 전월 데이터 fetch useEffect 추가**

주간 fetch useEffect 아래에 추가:

```typescript
  useEffect(() => {
    let cancelled = false;
    async function fetchPrevMonth() {
      const today = new Date();
      const isCurrentMonthView =
        month.getFullYear() === today.getFullYear() &&
        month.getMonth() === today.getMonth();

      // 현재 달 조회 중: 전월 1일~오늘 같은 일자
      // 다른 달 조회 중: 그 달 전체 vs 전전달 전체
      const compareDay = isCurrentMonthView ? today.getDate() : new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      const prevYear = month.getMonth() === 0 ? month.getFullYear() - 1 : month.getFullYear();
      const prevMonthIdx = month.getMonth() === 0 ? 12 : month.getMonth(); // 1-based
      const mm = String(prevMonthIdx).padStart(2, "0");
      const dd = String(compareDay).padStart(2, "0");
      // 전월의 compareDay가 실제 존재하는 날짜인지 확인
      const lastDayOfPrev = new Date(prevYear, prevMonthIdx, 0).getDate();
      const actualDay = Math.min(compareDay, lastDayOfPrev);
      const start = `${prevYear}-${mm}-01`;
      const end = `${prevYear}-${mm}-${String(actualDay).padStart(2, "0")}`;

      try {
        const sales = await getSalesByRange(start, end);
        if (cancelled) return;
        const total = sales
          .filter((s) => !s.is_holiday)
          .reduce((sum, s) => sum + s.amount, 0);
        setPrevMonthTotal(total > 0 ? total : null);
      } catch {
        if (!cancelled) setPrevMonthTotal(null);
      }
    }
    void fetchPrevMonth();
    return () => { cancelled = true; };
  }, [month, refreshKey]);
```

- [ ] **Step 3: 전월 대비 계산 변수 추가**

`const achievementRate = ...` 아래에 추가:

```typescript
  const prevMonthDiff =
    prevMonthTotal !== null && prevMonthTotal > 0
      ? Math.round(((monthTotal - prevMonthTotal) / prevMonthTotal) * 100)
      : null;
```

- [ ] **Step 4: 헤더 UI에 전월 대비 행 추가**

`{/* 이번 주 소계 */}` 바로 위에 추가:

```tsx
          {/* 전월 대비 */}
          {prevMonthDiff !== null && (
            <div className="flex items-center justify-between px-4 py-1.5 bg-(--gray-6) border-t border-(--gray-5)">
              <span className="text-sm font-semibold text-(--gray-2)">전월 대비</span>
              <span
                className={`text-base font-black tabular-nums ${
                  prevMonthDiff > 0
                    ? "text-(--green)"
                    : prevMonthDiff < 0
                      ? "text-(--cal-sun)"
                      : "text-(--gray-3)"
                }`}
              >
                {prevMonthDiff > 0 ? "▲" : prevMonthDiff < 0 ? "▼" : "—"}{" "}
                {Math.abs(prevMonthDiff)}%
              </span>
            </div>
          )}
```

- [ ] **Step 5: 검증**

```bash
npx tsc --noEmit && npm run lint
```

기대 결과: 오류 없음

- [ ] **Step 6: 커밋**

```bash
git add src/components/calendar/SalesCalendar.tsx
git commit -m "feat: 캘린더 헤더에 전월 대비 비교 추가"
```

---

### Task 6: 요일별 평균 (ChartWeekly)

**Files:**
- Modify: `src/components/chart/ChartWeekly.tsx`

- [ ] **Step 1: 요일별 평균 상태 추가**

기존 state 선언부 아래에 추가:

```typescript
  interface DayAvgItem { label: string; avg: number; }
  const [dayAvgData, setDayAvgData] = useState<DayAvgItem[]>([]);
```

- [ ] **Step 2: 요일별 평균 fetch useEffect 추가**

기존 useEffect 아래에 추가:

```typescript
  useEffect(() => {
    let cancelled = false;
    async function fetchDayAvg() {
      try {
        const today = new Date();
        const eightWeeksAgo = new Date(today);
        eightWeeksAgo.setDate(today.getDate() - 56);
        const sales = await getSalesByRange(toDateStr(eightWeeksAgo), toDateStr(today));
        if (cancelled) return;

        // 요일별(0=일~6=토) 합산, 횟수 집계 (휴무일·0원 제외)
        const sums: Record<number, number> = {};
        const counts: Record<number, number> = {};
        for (let i = 0; i < 7; i++) { sums[i] = 0; counts[i] = 0; }
        sales.forEach((s) => {
          if (s.is_holiday || s.amount === 0) return;
          const dow = new Date(s.date).getDay();
          sums[dow] += s.amount;
          counts[dow]++;
        });

        // 월~일 순서로 (1=월 ... 0=일)
        const labels = ["월", "화", "수", "목", "금", "토", "일"];
        const dowOrder = [1, 2, 3, 4, 5, 6, 0];
        setDayAvgData(
          dowOrder.map((dow, i) => ({
            label: labels[i],
            avg: counts[dow] > 0 ? Math.round(sums[dow] / counts[dow]) : 0,
          }))
        );
      } catch {
        if (!cancelled) setDayAvgData([]);
      }
    }
    void fetchDayAvg();
    return () => { cancelled = true; };
  }, []);
```

- [ ] **Step 3: 차트 아래에 요일별 평균 섹션 추가**

차트 `</div>` 바로 아래 (컴포넌트 return 닫기 전)에 추가:

```tsx
      {/* 요일별 평균 */}
      {dayAvgData.some((d) => d.avg > 0) && (
        <div className="px-5 pt-3 pb-5 border-t border-(--gray-5)">
          <p className="text-xs font-bold text-(--gray-3) mb-3">요일별 평균 (최근 8주)</p>
          {(() => {
            const maxAvg = Math.max(...dayAvgData.map((d) => d.avg));
            return dayAvgData.map((d) => (
              <div key={d.label} className="flex items-center gap-3 mb-2">
                <span className="w-5 text-xs font-black text-(--gray-2) shrink-0">{d.label}</span>
                <div className="flex-1 bg-(--gray-6) h-5 relative">
                  <div
                    className="h-full bg-black"
                    style={{ width: maxAvg > 0 ? `${(d.avg / maxAvg) * 100}%` : "0%" }}
                  />
                </div>
                <span className="text-xs font-bold text-(--gray-2) tabular-nums w-14 text-right shrink-0">
                  {d.avg > 0 ? `${Math.round(d.avg / 10000)}만` : "—"}
                </span>
              </div>
            ));
          })()}
        </div>
      )}
```

- [ ] **Step 4: 검증**

```bash
npx tsc --noEmit && npm run lint
```

기대 결과: 오류 없음

- [ ] **Step 5: 커밋**

```bash
git add src/components/chart/ChartWeekly.tsx
git commit -m "feat: 주간 차트에 요일별 평균 섹션 추가"
```

---

### Task 7: 메모 검색 (MemoSearch 컴포넌트 + 설정 페이지 리팩토링)

**Files:**
- Create: `src/components/settings/MemoSearch.tsx`
- Modify: `src/components/settings/GoalSettings.tsx`
- Modify: `src/app/(main)/settings/page.tsx`

- [ ] **Step 1: MemoSearch.tsx 생성**

`src/components/settings/MemoSearch.tsx` 생성:

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Sale } from "@/types";

export default function MemoSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Sale[]>([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) { setResults([]); return; }

    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("sales")
          .select("*")
          .ilike("memo", `%${query.trim()}%`)
          .order("date", { ascending: false })
          .limit(50);
        if (error) throw error;
        setResults(data ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  return (
    <div className="px-5 py-4 border-b-2 border-(--gray-5)">
      {/* 검색창 */}
      <div className="border-2 border-black flex items-center px-3 gap-2 mb-3">
        <span className="text-base text-(--gray-3)">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="메모 검색..."
          className="flex-1 bg-white py-3 text-base text-black placeholder-(--gray-4) focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="검색어 지우기"
            className="text-(--gray-3) text-lg font-light"
          >
            ×
          </button>
        )}
      </div>

      {/* 결과 */}
      {query.trim() && (
        <div>
          {searching ? (
            <p className="text-sm text-(--gray-3) font-bold py-2">검색 중...</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-(--gray-3) font-bold py-2">검색 결과가 없습니다</p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {results.map((sale) => (
                <li key={sale.id} className="flex items-start gap-3 py-2 border-b border-(--gray-5)">
                  <span className="text-sm font-black text-black shrink-0 tabular-nums">
                    {sale.date}
                  </span>
                  <span className="text-sm font-bold text-(--gray-2) shrink-0 tabular-nums">
                    {sale.amount.toLocaleString("ko-KR")}원
                  </span>
                  <span className="text-sm text-(--gray-3) truncate">{sale.memo}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: GoalSettings에서 h-full 제거**

`src/components/settings/GoalSettings.tsx` 의 최상위 div 변경:

```tsx
  return (
    <div className="flex flex-col">
```

> `h-full` 제거. 저장 버튼은 계속 컴포넌트 하단에 인라인으로 위치.

- [ ] **Step 3: 설정 페이지 리팩토링**

`src/app/(main)/settings/page.tsx` 전체 교체:

```tsx
import GoalSettings from "@/components/settings/GoalSettings";
import MemoSearch from "@/components/settings/MemoSearch";

export default function SettingsPage() {
  return (
    <main className="h-full flex flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b-4 border-black px-5 pt-12 pb-4">
        <p className="text-sm font-bold text-(--gray-3) mb-1">매출 관리</p>
        <h1 className="text-4xl font-black text-black">설정</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <MemoSearch />
        <GoalSettings />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: 검증**

```bash
npx tsc --noEmit && npm run lint
```

기대 결과: 오류 없음

- [ ] **Step 5: 커밋**

```bash
git add src/components/settings/MemoSearch.tsx src/components/settings/GoalSettings.tsx src/app/(main)/settings/page.tsx
git commit -m "feat: 설정 페이지 메모 검색 기능 추가"
```

---

### Task 8: JSON 백업/복원 (DataManager 컴포넌트)

**Files:**
- Create: `src/components/settings/DataManager.tsx`
- Modify: `src/app/(main)/settings/page.tsx`

- [ ] **Step 1: DataManager.tsx 생성**

`src/components/settings/DataManager.tsx` 생성:

```tsx
"use client";

import { useState, useRef } from "react";
import { getAllSales } from "@/lib/supabase/queries";
import { upsertSale } from "@/lib/supabase/queries";

interface BackupData {
  version: number;
  exportedAt: string;
  sales: { date: string; amount: number; memo: string | null; is_holiday: boolean }[];
}

export default function DataManager() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; fail: number } | null>(null);
  const [exportError, setExportError] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setExporting(true);
    setExportError(false);
    try {
      const sales = await getAllSales();
      const backup: BackupData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        sales: sales.map((s) => ({
          date: s.date,
          amount: s.amount,
          memo: s.memo,
          is_holiday: s.is_holiday,
        })),
      };
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const today = new Date().toLocaleDateString("sv-SE");
      a.href = url;
      a.download = `daily-sales-backup-${today}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // 파일 input 초기화 (같은 파일 재선택 가능하도록)
    e.target.value = "";

    setImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const text = await file.text();
      const data: unknown = JSON.parse(text);

      if (
        typeof data !== "object" ||
        data === null ||
        !("version" in data) ||
        !("sales" in data) ||
        !Array.isArray((data as BackupData).sales)
      ) {
        setImportError("올바른 백업 파일이 아닙니다.");
        return;
      }

      const backup = data as BackupData;
      const total = backup.sales.length;
      let success = 0;
      let fail = 0;

      for (let i = 0; i < backup.sales.length; i++) {
        setImportProgress({ done: i, total });
        try {
          const s = backup.sales[i];
          await upsertSale({
            date: s.date,
            amount: s.amount,
            memo: s.memo,
            is_holiday: s.is_holiday ?? false,
          });
          success++;
        } catch {
          fail++;
        }
      }

      setImportProgress(null);
      setImportResult({ success, fail });
    } catch {
      setImportError("파일을 읽는 중 오류가 발생했습니다.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="px-5 py-5 border-t-2 border-(--gray-5)">
      <p className="text-xs font-black text-(--gray-3) mb-4 uppercase tracking-wide">데이터 관리</p>

      <div className="flex gap-3">
        {/* 내보내기 */}
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || importing}
          className="flex-1 border-2 border-black py-4 text-sm font-black active:bg-(--gray-5) disabled:opacity-40 transition-colors"
        >
          {exporting ? "내보내는 중..." : "JSON 내보내기"}
        </button>

        {/* 가져오기 */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing || exporting}
          className="flex-1 border-2 border-black py-4 text-sm font-black active:bg-(--gray-5) disabled:opacity-40 transition-colors"
        >
          {importing
            ? importProgress
              ? `가져오는 중... (${importProgress.done}/${importProgress.total})`
              : "처리 중..."
            : "JSON 가져오기"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />
      </div>

      {/* 에러/결과 피드백 */}
      {exportError && (
        <p className="mt-3 text-sm font-bold text-(--cal-sun)">내보내기에 실패했습니다.</p>
      )}
      {importError && (
        <p className="mt-3 text-sm font-bold text-(--cal-sun)">{importError}</p>
      )}
      {importResult && (
        <p className="mt-3 text-sm font-bold text-(--gray-2)">
          가져오기 완료 — 성공 {importResult.success}건
          {importResult.fail > 0 && `, 실패 ${importResult.fail}건`}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 설정 페이지에 DataManager 추가**

`src/app/(main)/settings/page.tsx` 를 다음으로 교체:

```tsx
import GoalSettings from "@/components/settings/GoalSettings";
import MemoSearch from "@/components/settings/MemoSearch";
import DataManager from "@/components/settings/DataManager";

export default function SettingsPage() {
  return (
    <main className="h-full flex flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b-4 border-black px-5 pt-12 pb-4">
        <p className="text-sm font-bold text-(--gray-3) mb-1">매출 관리</p>
        <h1 className="text-4xl font-black text-black">설정</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <MemoSearch />
        <GoalSettings />
        <DataManager />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: 검증**

```bash
npx tsc --noEmit && npm run lint
```

기대 결과: 오류 없음

- [ ] **Step 4: 빌드 검증**

```bash
npm run build
```

기대 결과: ✓ Compiled successfully

- [ ] **Step 5: 커밋**

```bash
git add src/components/settings/DataManager.tsx src/app/(main)/settings/page.tsx
git commit -m "feat: JSON 백업/복원 기능 추가"
```

---

### Task 9: CLAUDE.md 업데이트

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 완료된 기능 체크박스 업데이트**

`CLAUDE.md` 의 `### 📦 미완료 기능` 섹션에서:

```markdown
- [x] 데이터 백업 및 복원 (JSON 내보내기 / 가져오기)
```

버그 & 개선 사항 표에서 완료된 항목 제거 또는 완료 표시.

- [ ] **Step 2: 커밋**

```bash
git add CLAUDE.md
git commit -m "chore: CLAUDE.md 완료 기능 업데이트"
```

---

### Task 10: 최종 Push

- [ ] **Step 1: 전체 Push**

```bash
git push origin main
```
