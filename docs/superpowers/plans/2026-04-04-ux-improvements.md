# UX 개선 & 버그 수정 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 대시보드 이번 주 소계 추가, 오늘 빠른 입력 FAB, 목표 자동 계산, 버그 수정(race condition, overflow, safe area) 구현

**Architecture:** 기존 SalesCalendar에 상태/UI 추가, GoalSettings에 자동계산 로직 추가, 레이아웃에 safe-area 대응. 새 파일 없이 기존 파일만 수정.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind CSS v4, Supabase, Zustand

---

## 파일 변경 목록

| 파일 | 작업 |
|---|---|
| `src/app/layout.tsx` | viewport-fit=cover 추가 |
| `src/app/(main)/layout.tsx` | safe-area 콘텐츠 패딩 수정 |
| `src/components/layout/BottomNav.tsx` | iOS safe-area-inset-bottom 추가 |
| `src/components/calendar/SalesCalendar.tsx` | race condition 수정, 이번 주 소계, FAB 추가 |
| `src/components/calendar/SalesDayDialog.tsx` | body.overflow 원래 값 복원 |
| `src/components/settings/GoalSettings.tsx` | 일 목표 → 월/연간 자동 계산 |

---

## Task 1: iOS Safe Area 대응

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/(main)/layout.tsx`
- Modify: `src/components/layout/BottomNav.tsx`

- [ ] **Step 1: layout.tsx에 viewport 설정 추가**

`src/app/layout.tsx`에서 `Metadata` import에 `Viewport` 추가하고 별도 export:

```typescript
import type { Metadata, Viewport } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "900"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "매출 관리",
  description: "매일 매출을 간편하게 기록하세요",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "매출 관리",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${playfair.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: BottomNav에 safe-area 패딩 추가**

`src/components/layout/BottomNav.tsx`의 `nav` 클래스에 `pb-[env(safe-area-inset-bottom)]` 추가:

```typescript
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-4 border-black pb-[env(safe-area-inset-bottom)]">
      <ul className="flex h-16 items-stretch">
```

- [ ] **Step 3: (main)/layout.tsx 콘텐츠 패딩 safe-area 반영**

BottomNav가 safe-area만큼 높아지므로 콘텐츠 패딩도 동일하게 조정:

```typescript
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <div className="flex-1 overflow-hidden pb-[calc(4rem+env(safe-area-inset-bottom))]">{children}</div>
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/app/layout.tsx src/app/\(main\)/layout.tsx src/components/layout/BottomNav.tsx
git commit -m "fix: iOS safe area 대응 (viewport-fit, BottomNav, 콘텐츠 패딩)"
```

---

## Task 2: SalesDayDialog body.overflow 복원 버그

**Files:**
- Modify: `src/components/calendar/SalesDayDialog.tsx:34-37`

> 참고: 백드롭 클릭 닫기는 이미 구현되어 있음 (line 87 `onClick={handleClose}`, line 91 `stopPropagation`)

- [ ] **Step 1: overflow 원래 값 저장 후 복원**

`src/components/calendar/SalesDayDialog.tsx` 34~37줄을 수정:

```typescript
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = orig; };
  }, []);
```

- [ ] **Step 2: 커밋**

```bash
git add src/components/calendar/SalesDayDialog.tsx
git commit -m "fix: SalesDayDialog body.overflow 원래 값 복원"
```

---

## Task 3: SalesCalendar Race Condition 수정 + 이번 주 소계 추가

**Files:**
- Modify: `src/components/calendar/SalesCalendar.tsx`

- [ ] **Step 1: import에 getSalesByRange 추가**

파일 상단 import를 수정:

```typescript
import { getSalesByMonth, getSalesByYear, getSalesByRange } from "@/lib/supabase/queries";
```

- [ ] **Step 2: 헬퍼 함수 추가 (컴포넌트 밖)**

`WEEKDAYS_KO` 상수 아래에 추가:

```typescript
// 이번 주(월~일) 날짜 범위 반환
function getThisWeekRange(): { start: string; end: string } {
  const today = new Date();
  const day = today.getDay(); // 0=일, 1=월, ...
  const diff = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return {
    start: weekStart.toLocaleDateString("sv-SE"),
    end: weekEnd.toLocaleDateString("sv-SE"),
  };
}
```

- [ ] **Step 3: 상태 추가 및 race condition 수정**

컴포넌트 내부 상태 선언부에 `weekTotal` 추가:

```typescript
  const [weekTotal, setWeekTotal] = useState<number>(0);
```

기존 월별 fetch useEffect (39~49줄)를 race condition 방지 버전으로 교체:

```typescript
  useEffect(() => {
    let cancelled = false;
    async function fetchSales() {
      try {
        const sales = await getSalesByMonth(month.getFullYear(), month.getMonth() + 1);
        if (cancelled) return;
        const map: Record<string, Sale> = {};
        sales.forEach((sale) => { map[sale.date] = sale; });
        setSalesMap(map);
      } catch { /* 오류 무시 */ }
    }
    void fetchSales();
    return () => { cancelled = true; };
  }, [month, refreshKey]);
```

이번 주 소계 fetch useEffect를 연간 누적 fetch 아래에 추가:

```typescript
  useEffect(() => {
    const { start, end } = getThisWeekRange();
    getSalesByRange(start, end)
      .then((sales) => setWeekTotal(sales.reduce((sum, s) => sum + s.amount, 0)))
      .catch(() => {});
  }, [refreshKey]);
```

- [ ] **Step 4: 이번 주 소계 UI 추가**

기존 연간 누적 행 (140~146줄) 바로 위에 이번 주 행 삽입:

```typescript
          {/* 이번 주 소계 */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-(--gray-6) border-t border-(--gray-5)">
            <span className="text-sm font-semibold text-(--gray-2)">이번 주</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-black tabular-nums">{weekTotal.toLocaleString("ko-KR")}</span>
              <span className="text-sm font-bold text-(--gray-2)">원</span>
            </div>
          </div>

          {/* 연간 누적 */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-(--gray-6) border-t border-(--gray-5)">
            <span className="text-sm font-semibold text-(--gray-2)">{month.getFullYear()}년 누적</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-black tabular-nums">{yearTotal.toLocaleString("ko-KR")}</span>
              <span className="text-sm font-bold text-(--gray-2)">원</span>
            </div>
          </div>
```

- [ ] **Step 5: 커밋**

```bash
git add src/components/calendar/SalesCalendar.tsx
git commit -m "fix: 월별 fetch race condition 수정, feat: 이번 주 소계 추가"
```

---

## Task 4: 오늘 빠른 입력 FAB 추가

**Files:**
- Modify: `src/components/calendar/SalesCalendar.tsx`

- [ ] **Step 1: 현재 달 여부 및 오늘 매출 변수 추가**

컴포넌트 내부에서 `achievementRate` 계산 아래에 추가:

```typescript
  const today = new Date();
  const isCurrentMonth =
    month.getFullYear() === today.getFullYear() &&
    month.getMonth() === today.getMonth();
  const todaySale = salesMap[todayStr];
  const fabLabel = todaySale
    ? `✓ ${todaySale.amount >= 10000 ? `${Math.round(todaySale.amount / 10000)}만` : todaySale.amount.toLocaleString("ko-KR")}`
    : "오늘 +";
```

- [ ] **Step 2: FAB 버튼 JSX 추가**

`return` 내부 최하단, `{/* 매출 입력 다이얼로그 */}` 바로 위에 삽입:

```typescript
      {/* 오늘 빠른 입력 FAB */}
      {isCurrentMonth && (
        <button
          className="fixed bottom-20 right-4 z-40 bg-black text-white rounded-full px-4 py-3 text-sm font-black shadow-lg active:opacity-70 transition-opacity"
          onClick={() => {
            setDialogDate(today);
            setHighlightedDate(today);
          }}
        >
          {fabLabel}
        </button>
      )}
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/calendar/SalesCalendar.tsx
git commit -m "feat: 오늘 빠른 입력 FAB 추가"
```

---

## Task 5: 목표 자동 계산 (GoalSettings)

**Files:**
- Modify: `src/components/settings/GoalSettings.tsx`

- [ ] **Step 1: GoalRow에 hint prop 추가**

`GoalRowProps` 인터페이스와 `GoalRow` 컴포넌트 수정:

```typescript
interface GoalRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}

function GoalRow({ label, value, onChange, hint }: GoalRowProps) {
  return (
    <div className="flex items-center border-b-2 border-(--gray-5) py-4 gap-4">
      <label className="w-20 shrink-0 text-xl font-black text-black">{label}</label>
      <div className="flex-1">
        <div className="relative border-2 border-(--gray-4) focus-within:border-black transition-colors flex items-center">
          <input
            type="text"
            inputMode="numeric"
            value={value}
            onChange={(e) => onChange(fmt(e.target.value))}
            placeholder="0"
            className="w-full bg-white px-4 py-3 pr-10 text-right text-2xl font-black text-black placeholder-(--gray-4) focus:outline-none tabular-nums"
          />
          <span className="absolute right-3 text-base font-bold text-(--gray-3) pointer-events-none">원</span>
        </div>
        {hint && <p className="text-xs text-(--gray-3) mt-1 text-right">{hint}</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 자동 계산 상태 및 핸들러 추가**

`GoalSettings` 컴포넌트 내부 상태 선언부에 추가:

```typescript
  const [monthlyAutoCalced, setMonthlyAutoCalced] = useState(false);
  const [yearlyAutoCalced,  setYearlyAutoCalced]  = useState(false);
```

`handleSave` 함수 위에 일 목표 변경 핸들러 추가:

```typescript
  function handleDailyChange(v: string) {
    setDailyVal(v);
    const daily = parse(v);
    if (daily > 0) {
      // 비어있거나 자동 계산된 경우에만 덮어씀
      if (parse(monthlyVal) === 0 || monthlyAutoCalced) {
        setMonthlyVal(fmt(String(daily * 25)));
        setMonthlyAutoCalced(true);
      }
      if (parse(yearlyVal) === 0 || yearlyAutoCalced) {
        setYearlyVal(fmt(String(daily * 25 * 12)));
        setYearlyAutoCalced(true);
      }
    } else {
      if (monthlyAutoCalced) { setMonthlyVal(""); setMonthlyAutoCalced(false); }
      if (yearlyAutoCalced)  { setYearlyVal("");  setYearlyAutoCalced(false); }
    }
  }
```

- [ ] **Step 3: GoalRow 사용처 수정**

JSX 내부 GoalRow들을 수정 — 하루 행은 `handleDailyChange` 사용, 한 달/일 년 행에 hint 및 onChange에서 auto-calced 해제:

```typescript
        <GoalRow label="하루"   value={dailyVal}   onChange={handleDailyChange} />
        <GoalRow label="일주일" value={weeklyVal}  onChange={setWeeklyVal} />
        <GoalRow
          label="한 달"
          value={monthlyVal}
          onChange={(v) => { setMonthlyVal(v); setMonthlyAutoCalced(false); }}
          hint={monthlyAutoCalced ? "자동 계산됨 (하루 × 25)" : undefined}
        />
        <GoalRow
          label="일 년"
          value={yearlyVal}
          onChange={(v) => { setYearlyVal(v); setYearlyAutoCalced(false); }}
          hint={yearlyAutoCalced ? "자동 계산됨 (한 달 × 12)" : undefined}
        />
```

- [ ] **Step 4: handleClear에서 auto-calced 상태도 초기화**

기존 `handleClear` 함수에 추가:

```typescript
  function handleClear() {
    setDailyVal(""); setWeeklyVal(""); setMonthlyVal(""); setYearlyVal("");
    setDailyGoal(0); setWeeklyGoal(0); setMonthlyGoal(0); setYearlyGoal(0);
    setMonthlyAutoCalced(false); setYearlyAutoCalced(false);
    setSaved(false);
  }
```

- [ ] **Step 5: 커밋**

```bash
git add src/components/settings/GoalSettings.tsx
git commit -m "feat: 일 목표 입력 시 월/연간 목표 자동 계산"
```

---

## 검증 체크리스트

- [ ] 대시보드 헤더에 "이번 주" 행이 연간 누적 위에 표시됨
- [ ] 현재 달 보기 시 우하단에 FAB 표시, 다른 달로 이동하면 FAB 사라짐
- [ ] 오늘 매출 입력 후 FAB에 금액 표시 (✓ 32만 형식)
- [ ] FAB 클릭 시 오늘 날짜로 다이얼로그 즉시 오픈
- [ ] 목표 설정에서 하루 목표 입력 시 한 달/일 년 자동 계산
- [ ] 한 달/일 년 직접 수정 시 "자동 계산됨" 힌트 제거
- [ ] 초기화 버튼 클릭 시 자동 계산 상태도 리셋
- [ ] iPhone에서 BottomNav가 홈 인디케이터와 겹치지 않음
- [ ] 빠른 월 이동 시 이전 달 데이터가 잘못 표시되지 않음
