# CLAUDE.md — daily-sales

## 기본 규칙

- 모든 응답과 커뮤니케이션은 **한국어**로 한다
- 코드 내 주석도 한국어로 작성한다

---

## 프로젝트 개요

아버지가 매일 종이에 기록하던 매출을 스마트폰에서 쉽게 입력하고 통계를 볼 수 있는 PWA 매출 관리 앱.

- 혼자 쓰는 앱 (단일 사용자)
- 오프라인에서도 동작해야 함 (PWA)
- 데이터 유실 방지를 위해 Supabase 클라우드 저장

---

## 기술 스택

| 역할          | 기술                    |
| ------------- | ----------------------- |
| 프레임워크    | Next.js 15 (App Router) |
| 언어          | TypeScript              |
| 스타일        | Tailwind CSS v4         |
| UI 컴포넌트   | shadcn/ui               |
| 상태관리      | Zustand                 |
| DB / Auth     | Supabase                |
| 차트          | Recharts                |
| PWA           | next-pwa                |
| 패키지 매니저 | npm                     |

---

## 디렉토리 구조

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (main)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                  # shadcn/ui 컴포넌트 (수정 금지)
│   ├── calendar/
│   │   ├── SalesCalendar.tsx
│   │   └── SalesDayDialog.tsx
│   ├── chart/
│   │   ├── ChartLine.tsx
│   │   └── CurrencyInput.tsx
│   └── layout/
│       └── BottomNav.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # 브라우저용 Supabase 클라이언트
│   │   ├── server.ts        # 서버용 Supabase 클라이언트
│   │   └── types.ts         # Supabase 자동 생성 타입 (수정 금지)
│   └── utils.ts             # cn() 등 공통 유틸
├── store/
│   └── salesStore.ts        # Zustand 스토어
└── types/
    └── index.ts             # 공통 타입 정의
```

---

## 필수 기능

1. 하루 매출 입력 (캘린더에서 날짜 클릭 → 다이얼로그)
2. 매출에 메모 추가
3. 월별 총합 자동 계산
4. 연도별 총합 자동 계산
5. 주간 / 월간 / 연간 차트
6. 목표 설정 및 달성률 표시
7. 데이터 백업 및 복원

---

## 자주 시키는 작업

- 새 페이지 / 컴포넌트 생성
- Supabase 쿼리 작성 (CRUD)
- 차트 데이터 가공 로직
- UI 스타일 수정
- PWA 설정

---

## 코딩 규칙

### 공통

- 컴포넌트는 default export 사용
- 파일명은 PascalCase (컴포넌트), camelCase (유틸/훅)
- 타입은 `interface` 우선, 필요 시 `type` 사용
- 함수형 컴포넌트만 사용 (클래스 컴포넌트 금지)

### Tailwind

- 인라인 스타일(`style=""`) 사용 금지 → Tailwind 클래스 사용
- 클래스가 길어지면 `cn()` 유틸로 분리

### Supabase

- 클라이언트 컴포넌트 → `lib/supabase/client.ts` 사용
- 서버 컴포넌트 / Server Actions → `lib/supabase/server.ts` 사용
- `lib/supabase/types.ts`는 자동 생성 파일이므로 절대 직접 수정 금지

### 상태관리

- 서버 데이터는 Supabase에서 직접 fetch
- 클라이언트 UI 상태만 Zustand에서 관리
- Zustand store는 `store/` 폴더에만 작성

---

## AI가 자주 틀리는 패턴

### Supabase 클라이언트 혼용 금지

```typescript
// ❌ 클라이언트 컴포넌트에서 서버용 클라이언트 사용
import { createClient } from "@/lib/supabase/server";

// ✅ 클라이언트 컴포넌트
import { createClient } from "@/lib/supabase/client";

// ✅ 서버 컴포넌트 / Server Actions
import { createClient } from "@/lib/supabase/server";
```

### Next.js App Router 'use client' 누락

```typescript
// ❌ useState/useEffect 쓰면서 'use client' 없음
import { useState } from "react";

// ✅
("use client");
import { useState } from "react";
```

### Date 타입 처리

```typescript
// ❌ Supabase에서 받은 날짜를 그냥 사용
const date = sale.date; // string

// ✅ Date 객체로 변환 후 사용
const date = new Date(sale.date);
```

### Supabase 에러 처리 누락

```typescript
// ❌ 에러 처리 없음
const { data } = await supabase.from("sales").select();

// ✅
const { data, error } = await supabase.from("sales").select();
if (error) throw error;
```

### 금액 표시 포맷

```typescript
// ❌ 숫자 그대로 표시
<span>{amount}</span>

// ✅ 한국 원화 포맷
<span>{amount.toLocaleString('ko-KR')}원</span>
```

---

## Skills

| 이름                  | 경로                                            | 호출 시점             |
| --------------------- | ----------------------------------------------- | --------------------- |
| pre-task              | `.claude/skills/pre-task/SKILL.md`              | 모든 작업 시작 전     |
| verify-implementation | `.claude/skills/verify-implementation/SKILL.md` | 구현 완료 후          |
| supabase-pattern      | `.claude/skills/supabase-pattern/SKILL.md`      | Supabase 관련 작업 시 |
