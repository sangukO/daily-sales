# UX 개선 & 버그 수정 스펙

**날짜:** 2026-04-04  
**범위:** 대시보드 이번 주 소계 / 오늘 빠른 입력 FAB / 목표 자동 계산 / 버그 수정 4건

---

## 1. 대시보드 이번 주 소계

**위치:** `src/components/calendar/SalesCalendar.tsx`

헤더 하단 "연간 누적" 행 위에 "이번 주" 행 추가.

```
이달 총매출 (n일 기록)       [목표%]
3,200,000원
────────────────────────────────
이번 주         450,000원   ← 신규
2026년 누적   2,430,000원
```

- `getSalesByRange(weekStart, weekEnd)` 호출해 이번 주(월~일) 합산
- 주차 기준: `getWeekStart(new Date())` — 월요일 기준
- 주가 바뀌어도 자동 갱신 (컴포넌트 마운트 시 1회 fetch, refreshKey 변경 시 재fetch)
- 스타일: 기존 연간 누적 행과 동일한 `bg-(--gray-6) border-t border-(--gray-5)` 적용

---

## 2. 오늘 빠른 입력 FAB

**위치:** `src/components/calendar/SalesCalendar.tsx` (또는 `src/app/(main)/dashboard/page.tsx`)

**동작:**
- 항상 표시 (오늘 매출 입력 + 수정 모두 커버)
- 오늘 매출 없음: `오늘 +` 텍스트
- 오늘 매출 있음: `✓ 32만` (오늘 금액 축약 표시)
- 클릭: SalesDayDialog를 오늘 날짜로 즉시 오픈

**스타일:**
- 위치: `fixed bottom-20 right-4` (바텀 네브 `h-16` + 여백 위)
- 외형: 검정 배경(`bg-black`), 흰 텍스트, `rounded-full`, `px-4 py-3`, `shadow-lg`
- z-index: `z-40`

---

## 3. 목표 자동 제안

**위치:** `src/components/settings/GoalSettings.tsx`

- 일 목표 변경 시 월/연간 필드가 **비어 있는 경우에만** 자동 계산:
  - 월 목표 = 일 목표 × 25
  - 연간 목표 = 월 목표 × 12
- 주간 목표는 자동 계산 안 함 (영업 패턴이 다양해서)
- 자동 채워진 필드 옆에 `text-xs text-(--gray-3)` 으로 "자동 계산됨" 표시
- 사용자가 직접 수정하면 "자동 계산됨" 제거

---

## 4. 버그 수정

### 4-1. CurrencyInput iOS 자동 줌
- **파일:** `src/components/calendar/CurrencyInput.tsx`
- `input`에 `text-base` (16px) 클래스 추가

### 4-2. BottomNav iOS Safe Area
- **파일:** `src/components/layout/BottomNav.tsx`
- `nav` 또는 내부 컨테이너에 `pb-[env(safe-area-inset-bottom)]` 추가
- `h-16`을 `min-h-16` + `pb-safe` 구조로 변경

### 4-3. SalesDayDialog 개선
- **파일:** `src/components/calendar/SalesDayDialog.tsx`
- 백드롭 클릭 닫기: 배경 오버레이 `div`에 `onClick={handleClose}` 추가, 내부 시트에는 `e.stopPropagation()`
- body.overflow 복원: `const orig = document.body.style.overflow` 저장 후 cleanup에서 복원

### 4-4. SalesCalendar Race Condition
- **파일:** `src/components/calendar/SalesCalendar.tsx`
- `useEffect` 내 `let cancelled = false` 플래그 추가
- fetch 완료 후 `if (cancelled) return` 체크
- cleanup: `return () => { cancelled = true; }`
