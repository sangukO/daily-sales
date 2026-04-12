# Polish Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 토스트 메시지, 로딩 스켈레톤, 캘린더 스와이프, 설정 페이지 압축으로 앱 완성도를 높인다.

**Architecture:** Zustand `toastStore`로 전역 토스트 상태 관리, `Toast` 컴포넌트를 `(main)/layout.tsx`에 마운트. 스켈레톤은 기존 로딩 상태 변수 재활용. 스와이프는 터치 이벤트 핸들러를 SalesCalendar에 직접 추가.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, Zustand

---

## 파일 맵

| 파일 | 작업 |
|---|---|
| `src/store/toastStore.ts` | 신규 생성 — 토스트 전역 상태 |
| `src/components/layout/Toast.tsx` | 신규 생성 — 토스트 UI 컴포넌트 |
| `src/app/(main)/layout.tsx` | 수정 — Toast 컴포넌트 삽입 |
| `src/components/calendar/SalesDayDialog.tsx` | 수정 — 저장/삭제 후 토스트 호출 |
| `src/components/calendar/SalesCalendar.tsx` | 수정 — 스와이프 핸들러 + 스켈레톤 |
| `src/components/chart/ChartMonthly.tsx` | 수정 — 로딩 스켈레톤 |
| `src/components/chart/ChartWeekly.tsx` | 수정 — 로딩 스켈레톤 |
| `src/components/chart/ChartYearly.tsx` | 수정 — 로딩 스켈레톤 |
| `src/components/settings/GoalSettings.tsx` | 수정 — 패딩 압축 |
| `src/components/settings/MemoSearch.tsx` | 수정 — 패딩 압축 |
| `src/components/settings/DataManager.tsx` | 수정 — 패딩 압축 |

---

### Task 1: toastStore 생성

**Files:**
- Create: `src/store/toastStore.ts`

- [ ] `src/store/toastStore.ts` 생성

```typescript
import { create } from "zustand";

interface ToastState {
  message: string | null;
  show: (message: string) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message) => set({ message }),
  hide: () => set({ message: null }),
}));
```

- [ ] 커밋

```bash
git add src/store/toastStore.ts
git commit -m "feat: toastStore 추가"
```

---

### Task 2: Toast 컴포넌트 생성

**Files:**
- Create: `src/components/layout/Toast.tsx`

- [ ] `src/components/layout/Toast.tsx` 생성

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useToastStore } from "@/store/toastStore";

export default function Toast() {
  const { message, hide } = useToastStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!message) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(hide, 2000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [message, hide]);

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-black text-white px-5 py-3 text-base font-black transition-all duration-200 ${
        message ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      }`}
    >
      {message}
    </div>
  );
}
```

- [ ] `src/app/(main)/layout.tsx` 수정 — Toast 삽입

```tsx
import BottomNav from "@/components/layout/BottomNav";
import Toast from "@/components/layout/Toast";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <Toast />
      <div className="flex-1 overflow-hidden pb-[calc(4rem+env(safe-area-inset-bottom))]">{children}</div>
      <BottomNav />
    </div>
  );
}
```

- [ ] 커밋

```bash
git add src/components/layout/Toast.tsx src/app/(main)/layout.tsx
git commit -m "feat: Toast 컴포넌트 및 레이아웃 적용"
```

---

### Task 3: SalesDayDialog에서 토스트 호출

**Files:**
- Modify: `src/components/calendar/SalesDayDialog.tsx`

- [ ] `SalesDayDialog.tsx` 상단에 import 추가 및 `handleSave`, `handleDelete`에서 토스트 호출

`handleSave` 성공 시: `showToast("저장됐어요 ✓")`
`handleDelete` 성공 시: `showToast("삭제됐어요")`

변경할 부분:
```tsx
// import 추가
import { useToastStore } from "@/store/toastStore";

// 컴포넌트 내부 상단
const showToast = useToastStore((s) => s.show);

// handleSave 내 onSaved() 바로 위에
showToast("저장됐어요 ✓");

// handleDelete 내 onSaved() 바로 위에
showToast("삭제됐어요");
```

- [ ] 커밋

```bash
git add src/components/calendar/SalesDayDialog.tsx
git commit -m "feat: 저장/삭제 후 토스트 메시지 표시"
```

---

### Task 4: 캘린더 스와이프 월 이동

**Files:**
- Modify: `src/components/calendar/SalesCalendar.tsx`

- [ ] SalesCalendar의 달력 본체 `div`에 터치 핸들러 추가

`useRef`로 `touchStartX`를 저장하고, deltaX > 50px이면 월 이동.

```tsx
// 상단 ref 추가 (기존 prevYear ref 근처)
const touchStartX = useRef<number | null>(null);

// 터치 핸들러 함수 (컴포넌트 내부)
function handleTouchStart(e: React.TouchEvent) {
  touchStartX.current = e.touches[0].clientX;
}
function handleTouchEnd(e: React.TouchEvent) {
  if (touchStartX.current === null) return;
  const delta = e.changedTouches[0].clientX - touchStartX.current;
  touchStartX.current = null;
  if (delta > 50) setMonth(prevMonth(month));
  else if (delta < -50) setMonth(nextMonth(month));
}
```

달력 본체 `div` (`className="flex-1 overflow-hidden flex flex-col min-h-0"`)에 핸들러 연결:
```tsx
<div
  className="flex-1 overflow-hidden flex flex-col min-h-0"
  onTouchStart={handleTouchStart}
  onTouchEnd={handleTouchEnd}
>
```

- [ ] 커밋

```bash
git add src/components/calendar/SalesCalendar.tsx
git commit -m "feat: 캘린더 스와이프로 월 이동"
```

---

### Task 5: 캘린더 헤더 로딩 스켈레톤

**Files:**
- Modify: `src/components/calendar/SalesCalendar.tsx`

- [ ] `loading` state 추가 및 fetch 시 관리

```tsx
const [loading, setLoading] = useState(false);
```

월별 매출 fetch useEffect에서:
```tsx
useEffect(() => {
  let cancelled = false;
  async function fetchSales() {
    setLoading(true);       // 추가
    setFetchError(false);
    try {
      const sales = await getSalesByMonth(month.getFullYear(), month.getMonth() + 1);
      if (cancelled) return;
      const map: Record<string, Sale> = {};
      sales.forEach((sale) => { map[sale.date] = sale; });
      setSalesMap(map);
    } catch {
      if (!cancelled) setFetchError(true);
    } finally {
      if (!cancelled) setLoading(false);  // 추가
    }
  }
  void fetchSales();
  return () => { cancelled = true; };
}, [month, refreshKey]);
```

- [ ] 월 매출 요약 행에 스켈레톤 적용 — `loading`이면 pulse 박스, 아니면 기존 숫자 표시

```tsx
{/* 월 매출 요약 행 */}
<div className="flex items-center px-4 py-2 gap-3">
  <div className="flex-1">
    <p className="text-xs text-(--gray-3) font-medium mb-0.5">
      이달 총매출{salesDayCount > 0 && !loading ? ` (${salesDayCount}일 기록)` : ""}
    </p>
    {loading ? (
      <div className="h-8 w-32 bg-(--gray-5) animate-pulse rounded-sm" />
    ) : (
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black text-black tabular-nums leading-none">
          {monthTotal.toLocaleString("ko-KR")}
        </span>
        <span className="text-base font-bold text-(--gray-2)">원</span>
      </div>
    )}
  </div>
  {achievementRate !== null && !loading && (
    <div className="text-right shrink-0">
      <p className="text-xs text-(--gray-3) mb-0.5">월 목표</p>
      <p className={`text-2xl font-black tabular-nums leading-none ${achievementRate >= 100 ? "text-(--green)" : "text-black"}`}>
        {achievementRate}%
      </p>
    </div>
  )}
</div>
```

- [ ] 커밋

```bash
git add src/components/calendar/SalesCalendar.tsx
git commit -m "feat: 캘린더 헤더 로딩 스켈레톤 추가"
```

---

### Task 6: 차트 로딩 스켈레톤

**Files:**
- Modify: `src/components/chart/ChartMonthly.tsx`
- Modify: `src/components/chart/ChartWeekly.tsx`
- Modify: `src/components/chart/ChartYearly.tsx`

스켈레톤 마크업 (3개 차트 공통 — 기존 로딩 분기 교체):

```tsx
{/* 기존 코드 */}
) : loading ? (
  <div className="h-60 flex items-center justify-center text-lg font-bold text-(--gray-4)">
    불러오는 중...
  </div>
) : (

{/* 교체 후 */}
) : loading ? (
  <div className="h-60 flex items-end justify-around gap-1 px-2 pb-2">
    {Array.from({ length: 10 }).map((_, i) => (
      <div
        key={i}
        className="flex-1 bg-(--gray-5) animate-pulse rounded-sm"
        style={{ height: `${30 + Math.sin(i) * 20 + 20}%` }}
      />
    ))}
  </div>
) : (
```

ChartWeekly는 막대 수를 7개로:
```tsx
{Array.from({ length: 7 }).map((_, i) => ( ... ))}
```

ChartYearly는 12개로:
```tsx
{Array.from({ length: 12 }).map((_, i) => ( ... ))}
```

- [ ] ChartMonthly 로딩 스켈레톤 적용 (10개 바)
- [ ] ChartWeekly 로딩 스켈레톤 적용 (7개 바)
- [ ] ChartYearly 로딩 스켈레톤 적용 (12개 바)

- [ ] 커밋

```bash
git add src/components/chart/ChartMonthly.tsx src/components/chart/ChartWeekly.tsx src/components/chart/ChartYearly.tsx
git commit -m "feat: 차트 로딩 스켈레톤 추가"
```

---

### Task 7: 설정 페이지 압축 (세로 스크롤 제거)

**Files:**
- Modify: `src/components/settings/GoalSettings.tsx`
- Modify: `src/components/settings/MemoSearch.tsx`
- Modify: `src/components/settings/DataManager.tsx`

**GoalSettings.tsx** — `GoalRow` 내부 패딩 축소:
```tsx
// 변경 전
<div className="flex items-center border-b-2 border-(--gray-5) py-4 gap-4">
  ...
  <input ... className="... py-3 ... text-2xl ..." />

// 변경 후
<div className="flex items-center border-b-2 border-(--gray-5) py-2 gap-4">
  ...
  <input ... className="... py-2 ... text-xl ..." />
```

저장 버튼 패딩도 축소:
```tsx
// 변경 전
<button ... className="flex-1 py-5 text-xl ...">
<button ... className="px-6 py-5 text-lg ...">

// 변경 후
<button ... className="flex-1 py-4 text-lg ...">
<button ... className="px-5 py-4 text-base ...">
```

**MemoSearch.tsx** — 외부 패딩 축소:
```tsx
// 변경 전
<div className="px-5 py-4 border-b-2 ...">
  <div ... className="... mb-3">
  <input ... className="... py-3 ...">

// 변경 후
<div className="px-5 py-3 border-b-2 ...">
  <div ... className="... mb-2">
  <input ... className="... py-2 ...">
```

**DataManager.tsx** — 패딩 축소:
```tsx
// 변경 전
<div className="px-5 py-5 border-t-2 ...">
  <p className="... mb-4 ...">
  <button ... className="... py-4 ...">

// 변경 후
<div className="px-5 py-3 border-t-2 ...">
  <p className="... mb-3 ...">
  <button ... className="... py-3 ...">
```

- [ ] GoalSettings 패딩 압축
- [ ] MemoSearch 패딩 압축
- [ ] DataManager 패딩 압축

- [ ] 커밋

```bash
git add src/components/settings/GoalSettings.tsx src/components/settings/MemoSearch.tsx src/components/settings/DataManager.tsx
git commit -m "fix: 설정 페이지 세로 스크롤 제거 — 여백 압축"
```

---

### Task 8: 브랜치 PR 및 머지

- [ ] 기능 브랜치에서 PR 생성 후 main으로 머지
