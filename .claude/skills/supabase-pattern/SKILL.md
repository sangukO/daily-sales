# supabase-pattern SKILL

## 목적
Supabase 관련 작업 시 올바른 패턴을 적용한다.

## 실행 시점
Supabase 쿼리 작성, Auth 처리, RLS 관련 작업 시

---

## 패턴 1 — 클라이언트 생성

### 브라우저 (클라이언트 컴포넌트)
```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 서버 (서버 컴포넌트 / Server Actions)
```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

---

## 패턴 2 — 쿼리 작성

모든 쿼리는 `src/lib/supabase/queries.ts`에 함수로 모은다.
컴포넌트에서 직접 supabase 클라이언트 호출 금지.

```typescript
// src/lib/supabase/queries.ts
import { createClient } from './client'
import type { Sale } from '@/types'

// 월별 매출 조회
export async function getSalesByMonth(year: number, month: number): Promise<Sale[]> {
  const supabase = createClient()
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`

  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) throw error
  return data ?? []
}

// 매출 저장 (신규 + 수정)
export async function upsertSale(sale: Omit<Sale, 'id'> & { id?: string }): Promise<Sale> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('sales')
    .upsert(sale)
    .select()
    .single()

  if (error) throw error
  return data
}

// 매출 삭제
export async function deleteSale(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('id', id)

  if (error) throw error
}
```

---

## 패턴 3 — 날짜 처리

Supabase date 컬럼은 항상 `YYYY-MM-DD` 문자열로 주고받는다.

```typescript
// ❌ Date 객체 직접 전달
.eq('date', new Date())

// ✅ ISO 문자열로 변환
.eq('date', new Date().toISOString().split('T')[0])

// ✅ date-fns 사용 시
import { format } from 'date-fns'
.eq('date', format(new Date(), 'yyyy-MM-dd'))
```

---

## 패턴 4 — Auth 처리

```typescript
// 현재 로그인 유저 확인
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')

// 로그인
const { error } = await supabase.auth.signInWithPassword({
  email,
  password,
})

// 로그아웃
await supabase.auth.signOut()
```

---

## 패턴 5 — RLS (Row Level Security)

모든 쿼리는 RLS에 의해 자동으로 현재 로그인 유저의 데이터만 접근 가능.
별도로 user_id 필터를 추가할 필요 없음.

```typescript
// ❌ 불필요한 user_id 필터
.eq('user_id', user.id)

// ✅ RLS가 자동 처리하므로 생략
.select('*')
```
