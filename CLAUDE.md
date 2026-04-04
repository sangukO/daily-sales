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

| 역할 | 기술 |
|---|---|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| UI 컴포넌트 | shadcn/ui |
| 상태관리 | Zustand |
| DB / Auth | Supabase |
| 차트 | Recharts |
| PWA | next-pwa |
| 패키지 매니저 | npm |

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

## 기능 현황

### ✅ 완료된 기능
- 하루 매출 입력 (캘린더에서 날짜 클릭 → 바텀시트 다이얼로그)
- 매출에 메모 추가
- 월별 총합 자동 계산
- 로그인 / Auth (Supabase)
- 캘린더 뷰 (날짜별 매출액 표시)
- 바텀시트 애니메이션 (슬라이드업/다운)

### 🔲 남은 기능 (우선순위 순)

#### 필수
- [x] 연도별 총합 자동 계산

#### 추가 기능 A
- [ ] 월간 차트 (막대 또는 라인)
- [ ] 주간 차트
- [ ] 연간 차트
- [ ] 목표 설정 및 달성률 표시

#### 추가 기능 B
- [ ] PWA 설정 (오프라인 지원, 홈 화면 설치)
- [ ] 데이터 백업 및 복원 (JSON 내보내기/가져오기)

---

## 자율 작업 지침

Claude Code는 이 파일을 기준으로 **별도 지시 없이** 다음 순서로 작업을 진행한다.

1. 남은 기능을 우선순위 순서대로 구현한다
2. 각 기능 구현 전 `pre-task` 스킬을 실행한다
3. 각 기능 구현 후 `verify-implementation` 스킬을 실행한다
4. 기능 완성 후 Git 자동화 규칙에 따라 브랜치 생성 → 커밋 → PR → 머지한다
5. 완료된 기능은 이 파일의 `[ ]` 체크박스를 `[x]`로 업데이트한다
6. "다음 작업" 항목을 다음에 해야 할 기능으로 업데이트한다
7. 모든 기능이 완료되면 "다음 작업" 항목을 "✅ 모든 기능 완료"로 업데이트한다
8. CLAUDE.md 업데이트도 같은 브랜치에 포함해서 커밋한다
9. 모든 작업은 한국어로 보고한다

### 다음 작업
**월간 차트** — 해당 월의 일별 매출을 막대 또는 라인 차트로 표시

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
import { createClient } from '@/lib/supabase/server'

// ✅ 클라이언트 컴포넌트
import { createClient } from '@/lib/supabase/client'

// ✅ 서버 컴포넌트 / Server Actions
import { createClient } from '@/lib/supabase/server'
```

### Next.js App Router 'use client' 누락
```typescript
// ❌ useState/useEffect 쓰면서 'use client' 없음
import { useState } from 'react'

// ✅
'use client'
import { useState } from 'react'
```

### Date 타입 처리
```typescript
// ❌ Supabase에서 받은 날짜를 그냥 사용
const date = sale.date // string

// ✅ Date 객체로 변환 후 사용
const date = new Date(sale.date)
```

### Supabase 에러 처리 누락
```typescript
// ❌ 에러 처리 없음
const { data } = await supabase.from('sales').select()

// ✅
const { data, error } = await supabase.from('sales').select()
if (error) throw error
```

### 금액 표시 포맷
```typescript
// ❌ 숫자 그대로 표시
<span>{amount}</span>

// ✅ 한국 원화 포맷
<span>{amount.toLocaleString('ko-KR')}원</span>
```

---

## Git 자동화 규칙

### 브랜치 전략
- `main` 브랜치에 직접 커밋 금지
- 모든 작업은 기능 브랜치에서 진행
- 브랜치 네이밍: `feat/기능명`, `fix/버그명`, `chore/작업명`

### 작업 시작 시
1. `main` 최신화 후 기능 브랜치 생성
```bash
git checkout main
git pull origin main
git checkout -b feat/기능명
```

### 작업 완료 시
1. 변경 파일을 논리적 단위로 그룹화
2. 각 그룹별로 커밋 (한 번에 전부 커밋 금지)
3. 커밋 메시지 형식:
```
feat: 캘린더 매출 입력 기능 추가
fix: 다이얼로그 배경 스크롤 버그 수정
chore: 패키지 설치 및 환경 설정
```
4. PR 생성 → main으로 머지 → 브랜치 삭제

### PR 규칙
- PR 제목은 커밋 메시지와 동일한 형식
- PR 본문에 작업 내용 한국어로 요약
- 머지 방식: Squash and merge

### AI가 자동으로 처리하는 것
- 브랜치 생성 및 전환
- 파일 스테이징 및 커밋
- PR 생성 및 머지
- 완료된 브랜치 삭제

---

## Skills

| 이름 | 경로 | 호출 시점 |
|---|---|---|
| pre-task | `.claude/skills/pre-task/SKILL.md` | 모든 작업 시작 전 |
| verify-implementation | `.claude/skills/verify-implementation/SKILL.md` | 구현 완료 후 |
| supabase-pattern | `.claude/skills/supabase-pattern/SKILL.md` | Supabase 관련 작업 시 |
