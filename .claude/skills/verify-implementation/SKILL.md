# verify-implementation SKILL

## 목적
구현 완료 후 코드 품질과 규칙 준수 여부를 검증한다.

## 실행 시점
컴포넌트 또는 기능 구현 완료 후

## 검증 단계

### Step 1 — ESLint 실행
```bash
npm run lint
```
오류가 있으면 전부 수정 후 다음 단계로 넘어간다.

### Step 2 — 타입 체크
```bash
npx tsc --noEmit
```
타입 오류가 있으면 전부 수정 후 다음 단계로 넘어간다.

### Step 3 — CLAUDE.md 규칙 체크
아래 항목을 코드에서 직접 확인한다.

| 항목 | 확인 내용 |
|---|---|
| use client | useState/useEffect 사용 시 파일 상단에 'use client' 선언 여부 |
| Supabase 클라이언트 | 클라이언트 컴포넌트에서 server.ts import 여부 (금지) |
| 인라인 스타일 | style="" 속성 사용 여부 (금지) |
| 금액 포맷 | amount 표시 시 toLocaleString('ko-KR') 적용 여부 |
| 에러 처리 | Supabase 쿼리에 error 처리 여부 |
| 파일 위치 | 디렉토리 구조에 맞는 위치에 생성됐는지 |

### Step 4 — 검증 결과 보고
아래 형식으로 한국어로 보고한다.

```
## 검증 결과
- ESLint: 통과 / 오류 N개 수정
- 타입 체크: 통과 / 오류 N개 수정
- 규칙 체크: 통과 / [위반 항목 및 수정 내용]
```
