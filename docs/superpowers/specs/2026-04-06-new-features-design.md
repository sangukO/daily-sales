# 신규 기능 스펙

**날짜:** 2026-04-06
**범위:** +증가 버튼 / 휴무일 구분 / 전월 대비 / 오늘로 이동 / 메모 검색 / 요일별 평균 / JSON 백업복원

---

## 1. +증가 버튼 (SalesDayDialog)

**위치:** `src/components/calendar/SalesDayDialog.tsx`

CurrencyInput 아래에 빠른 금액 추가 버튼 3개 배치.

```
[ 입력창: 1,500,000원 ]
[ +10만 ]  [ +30만 ]  [ +50만 ]
```

- 버튼 탭 시 현재 금액에 해당 값을 더함 (`setAmount(prev => prev + n)`)
- 버튼은 `SalesDayDialog` 내부에서 렌더링 (CurrencyInput 수정 없음)
- 스타일: `border-2 border-black`, 3등분 가로 배치, `py-3 text-sm font-black`

---

## 2. 휴무일 구분 (SalesDayDialog)

**위치:** `src/components/calendar/SalesDayDialog.tsx`

다이얼로그 상단에 탭 토글 추가. 기본은 "매출 입력" 탭.

```
[ 매출 입력 (선택됨) ]  [ 휴무일 ]
```

**매출 입력 탭 (기본):**
- 기존 금액 입력 UI + +증가 버튼 + 메모 필드 표시

**휴무일 탭:**
- 금액 입력/버튼/메모 전부 숨김
- "휴무일로 저장합니다" 안내 텍스트만 표시
- 저장 시 `amount: 0, memo: "휴무"` 로 upsert

**DB 처리:**
- 별도 컬럼 추가 없이 `memo` 필드에 `"휴무"` 저장
- 캘린더에서 `sale.memo === "휴무"` 이면 날짜 셀에 "휴" 텍스트 표시 (회색)
- 통계(월 총합, 연간 누적)에서는 `amount === 0` 인 경우 자동 제외됨 (현재 구조 그대로)

**기존 매출이 있는 날 휴무 전환:**
- 기존 데이터 upsert로 덮어씀 (삭제 후 재저장 아님)

---

## 3. 전월 대비 비교 (SalesCalendar)

**위치:** `src/components/calendar/SalesCalendar.tsx`

캘린더 헤더의 "이번 주" 행 바로 위에 전월 대비 행 추가.

```
이달 총매출 (n일 기록)      [목표%]
12,400,000원
────────────────────────────────
전월 대비     ▲ 8% · +980,000원   ← 신규
이번 주         3,200,000원
2026년 누적   48,000,000원
```

**데이터 계산:**
- 전월 같은 기간(1일~오늘 날짜) 매출 합계를 `getSalesByRange()`로 fetch
- 현재 달이 아닐 경우 (이전 달 조회 중): 그 달 전체 vs 그 전달 전체 비교
- 증감률: `Math.round(((현재 - 전월) / 전월) * 100)`
- 전월 데이터 없으면 해당 행 숨김

**스타일:**
- 증가: `text-(--green)` + ▲
- 감소: `text-(--cal-sun)` + ▼
- 동일: `text-(--gray-3)` + —

---

## 4. 오늘로 돌아오기 버튼 (SalesCalendar)

**위치:** `src/components/calendar/SalesCalendar.tsx`

현재 달이 아닐 때만 월 제목 아래에 "오늘로" 버튼 표시.

```
‹   2026년 2월   ›
      [ 오늘로 ]        ← 현재 달 아닐 때만 표시
```

- 클릭 시 `setMonth(new Date())` 실행
- 스타일: `border-2 border-black px-4 py-1.5 text-sm font-black`
- 애니메이션: 버튼 나타남/사라짐에 `transition-opacity`

---

## 5. 메모 검색 (settings 페이지)

**위치:** `src/app/(main)/settings/page.tsx`, 새 컴포넌트 `src/components/settings/MemoSearch.tsx`

설정 페이지 최상단에 검색창 배치.

**동작:**
- 입력 시 디바운스 300ms 후 Supabase 쿼리
- `supabase.from('sales').select().ilike('memo', '%검색어%').order('date', { ascending: false })`
- 결과: 날짜 + 금액 + 메모 리스트로 표시 (클릭 동작 없음 — 설정 페이지 내 단순 조회)
- 검색어 없으면 결과 영역 숨김

**스타일:**
- 검색창: `border-2 border-black`, 좌측 검색 아이콘, `placeholder="메모 검색..."`
- 결과 리스트: 날짜(굵게) + 금액 + 메모 한 줄

---

## 6. 요일별 평균 (ChartWeekly)

**위치:** `src/components/chart/ChartWeekly.tsx`

주간 차트 아래에 요일별 평균 막대 섹션 추가.

**데이터 계산:**
- 지난 8주치 데이터 fetch (`getSalesByRange(8주 전, 오늘)`)
- 요일별(월~일)로 그룹핑 → `amount > 0` 인 날만 평균 (휴무일 제외)
- 8주치 데이터를 컴포넌트 마운트 시 1회 fetch (weekStart 변경과 무관)

**표시:**
- 섹션 제목: "요일별 평균 (최근 8주)"
- 가로 막대 7개 (월~일), 최대값 기준 상대 너비
- 각 막대 오른쪽에 평균 금액 표시 (fmtShort 사용)

---

## 7. JSON 백업/복원 (settings 페이지)

**위치:** `src/app/(main)/settings/page.tsx`, 새 컴포넌트 `src/components/settings/DataManager.tsx`

설정 페이지 메모 검색 아래 "데이터 관리" 섹션.

### 내보내기
- "내보내기" 버튼 클릭 → 전체 sales 데이터 fetch → JSON 파일 다운로드
- 파일명: `daily-sales-backup-YYYY-MM-DD.json`
- JSON 구조:
```json
{
  "exportedAt": "2026-04-06T00:00:00Z",
  "version": 1,
  "sales": [
    { "date": "2026-04-06", "amount": 1500000, "memo": "메모" }
  ]
}
```

### 가져오기
- "가져오기" 버튼 → 파일 선택 (`input type="file" accept=".json"`)
- JSON 파싱 → 유효성 검사 (version, sales 배열 존재 여부)
- `upsertSale()` 반복 호출로 Supabase에 저장
- 진행 상태: "가져오는 중... (23/150)" 텍스트
- 완료 후 성공/실패 건수 표시

**에러 처리:**
- 잘못된 JSON: "올바른 백업 파일이 아닙니다" 표시
- 개별 upsert 실패: 건너뛰고 계속, 완료 후 실패 건수 표시
