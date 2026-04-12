# PWA 푸시 알림 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자가 설정한 시간에 오늘 매출 미입력 시 Android PWA 푸시 알림을 자동 발송한다.

**Architecture:** Vercel Cron이 매시간 `/api/push/cron`을 호출 → KST 기준 현재 시각이 `user_settings`에 저장된 알림 시간과 일치하고 오늘 sales 레코드가 없으면 `web-push`로 Android에 푸시 발송. 구독 정보(endpoint, keys)와 알림 시간은 기존 `user_settings` 테이블에 컬럼 추가. Service Worker push 핸들러는 `@ducanh2912/next-pwa`의 `customWorker` 옵션으로 추가.

**Tech Stack:** Next.js 15 App Router, web-push, @ducanh2912/next-pwa customWorker, Supabase, Vercel Cron

---

## 파일 맵

| 파일 | 작업 |
|---|---|
| `worker/index.ts` | 신규 — Service Worker push 이벤트 핸들러 |
| `next.config.ts` | 수정 — customWorker 옵션 추가 |
| `src/app/api/push/subscribe/route.ts` | 신규 — 구독 등록(POST) / 해제(DELETE) |
| `src/app/api/push/cron/route.ts` | 신규 — Vercel Cron 트리거 엔드포인트 |
| `src/lib/supabase/queries.ts` | 수정 — getNotificationSettings 추가 |
| `src/components/settings/NotificationSettings.tsx` | 신규 — 알림 설정 UI |
| `src/app/(main)/settings/page.tsx` | 수정 — NotificationSettings 삽입 |
| `vercel.json` | 신규 — Cron 스케줄 설정 |

---

### Task 1: web-push 패키지 설치

**Files:**
- Modify: `package.json`

- [ ] web-push와 타입 설치

```bash
npm install web-push
npm install --save-dev @types/web-push
```

- [ ] 설치 확인

```bash
npm ls web-push
```

Expected: `web-push@x.x.x` 출력됨

- [ ] 커밋

```bash
git add package.json package-lock.json
git commit -m "chore: web-push 패키지 설치"
```

---

### Task 2: VAPID 키 생성 + 환경변수 설정

**Files:**
- `.env.local` (로컬 개발용, git 미포함)
- Vercel 대시보드 환경변수

- [ ] VAPID 키 생성

```bash
npx web-push generate-vapid-keys
```

출력 예시:
```
Public Key: BxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxA
Private Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- [ ] `.env.local`에 추가 (생성된 값으로 교체)

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<위에서 생성된 Public Key>
VAPID_PRIVATE_KEY=<위에서 생성된 Private Key>
VAPID_EMAIL=mailto:admin@example.com
CRON_SECRET=<랜덤 문자열, 아래 명령으로 생성>
SUPABASE_SERVICE_ROLE_KEY=<Supabase 대시보드 Settings → API → service_role key>
```

CRON_SECRET 생성 방법:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- [ ] Vercel 대시보드에서 동일한 5개 환경변수 추가
  - Vercel 프로젝트 → Settings → Environment Variables
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` 추가

> `NEXT_PUBLIC_VAPID_PUBLIC_KEY`만 브라우저에 노출됨 (공개키라 안전). 나머지 4개는 서버 전용.

---

### Task 3: Supabase 마이그레이션 — user_settings에 푸시 컬럼 추가

**Files:**
- Supabase `user_settings` 테이블

- [ ] Supabase MCP로 마이그레이션 실행

```sql
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS notification_hour integer,
  ADD COLUMN IF NOT EXISTS push_endpoint text,
  ADD COLUMN IF NOT EXISTS push_p256dh text,
  ADD COLUMN IF NOT EXISTS push_auth text;
```

- [ ] 컬럼 추가 확인 — user_settings 테이블에 4개 컬럼 존재하는지 조회

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'user_settings'
  AND column_name IN ('notification_hour', 'push_endpoint', 'push_p256dh', 'push_auth');
```

Expected: 4개 행 반환됨

---

### Task 4: getNotificationSettings 쿼리 추가

**Files:**
- Modify: `src/lib/supabase/queries.ts`

- [ ] `queries.ts` 맨 아래에 추가

```typescript
// ── 푸시 알림 설정 조회 (클라이언트 전용) ──────────────────────────────

export interface NotificationConfig {
  notificationHour: number | null;
  hasSubscription: boolean;
}

export async function getNotificationSettings(): Promise<NotificationConfig> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { notificationHour: null, hasSubscription: false };

  const { data, error } = await supabase
    .from("user_settings")
    .select("notification_hour, push_endpoint")
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return { notificationHour: null, hasSubscription: false };
    throw error;
  }

  return {
    notificationHour: data.notification_hour ?? null,
    hasSubscription: !!data.push_endpoint,
  };
}
```

- [ ] 커밋

```bash
git add src/lib/supabase/queries.ts
git commit -m "feat: getNotificationSettings 쿼리 추가"
```

---

### Task 5: 구독 API 라우트 생성

**Files:**
- Create: `src/app/api/push/subscribe/route.ts`

- [ ] 디렉토리 및 파일 생성

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST: 구독 등록 및 알림 시간 저장
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
    notificationHour: number;
  };

  const { error } = await supabase
    .from("user_settings")
    .upsert({
      user_id: user.id,
      notification_hour: body.notificationHour,
      push_endpoint: body.subscription.endpoint,
      push_p256dh: body.subscription.keys.p256dh,
      push_auth: body.subscription.keys.auth,
      updated_at: new Date().toISOString(),
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE: 구독 해제
export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("user_settings")
    .update({
      notification_hour: null,
      push_endpoint: null,
      push_p256dh: null,
      push_auth: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] 커밋

```bash
git add src/app/api/push/subscribe/route.ts
git commit -m "feat: 푸시 구독 등록/해제 API 추가"
```

---

### Task 6: Cron API 라우트 생성

**Files:**
- Create: `src/app/api/push/cron/route.ts`

- [ ] 파일 생성

```typescript
import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

// 서비스 롤 키로 RLS 우회 (cron은 사용자 세션 없음)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(req: NextRequest) {
  // Vercel Cron 인증
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 푸시 구독이 있는 모든 사용자 조회
  const { data: settings, error } = await supabaseAdmin
    .from("user_settings")
    .select("user_id, notification_hour, push_endpoint, push_p256dh, push_auth")
    .not("push_endpoint", "is", null)
    .not("notification_hour", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!settings || settings.length === 0) return NextResponse.json({ sent: 0 });

  // 현재 KST 시각 (UTC+9)
  const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const currentHourKST = nowKST.getUTCHours();
  const todayKST = nowKST.toISOString().slice(0, 10); // "YYYY-MM-DD"

  let sent = 0;
  for (const row of settings) {
    // 알림 시간이 현재 KST 시간과 다르면 건너뜀
    if (row.notification_hour !== currentHourKST) continue;

    // 오늘 매출 입력 여부 확인
    const { data: sales } = await supabaseAdmin
      .from("sales")
      .select("id")
      .eq("user_id", row.user_id)
      .eq("date", todayKST)
      .limit(1);

    if (sales && sales.length > 0) continue; // 이미 입력했으면 건너뜀

    // 푸시 발송
    try {
      await webpush.sendNotification(
        {
          endpoint: row.push_endpoint,
          keys: { p256dh: row.push_p256dh, auth: row.push_auth },
        },
        JSON.stringify({
          title: "매출 입력 안 하셨어요!",
          body: "오늘 매출을 아직 기록하지 않았어요. 잊기 전에 입력해보세요 💰",
        })
      );
      sent++;
    } catch {
      // 구독 만료 등 오류는 무시
    }
  }

  return NextResponse.json({ sent });
}
```

- [ ] 커밋

```bash
git add src/app/api/push/cron/route.ts
git commit -m "feat: 푸시 알림 Cron API 추가"
```

---

### Task 7: Service Worker 푸시 핸들러 추가

**Files:**
- Create: `worker/index.ts` (프로젝트 루트)
- Modify: `next.config.ts`

- [ ] `worker/index.ts` 생성

```typescript
import { defaultCache } from "@ducanh2912/next-pwa/worker";

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("push", (event: PushEvent) => {
  const data = event.data?.json() as { title: string; body: string };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    })
  );
});

export default defaultCache;
```

- [ ] `next.config.ts` 수정 — `customWorker` 옵션 추가

```typescript
import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  customWorker: "worker/index.ts",
})(nextConfig);
```

- [ ] 커밋

```bash
git add worker/index.ts next.config.ts
git commit -m "feat: Service Worker 푸시 이벤트 핸들러 추가"
```

---

### Task 8: NotificationSettings 컴포넌트 생성

**Files:**
- Create: `src/components/settings/NotificationSettings.tsx`

- [ ] 파일 생성

```tsx
"use client";

import { useState, useEffect } from "react";
import { getNotificationSettings } from "@/lib/supabase/queries";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(h: number): string {
  if (h === 0) return "오전 12시";
  if (h < 12) return `오전 ${h}시`;
  if (h === 12) return "오후 12시";
  return `오후 ${h - 12}시`;
}

export default function NotificationSettings() {
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(21); // 기본: 오후 9시
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    getNotificationSettings()
      .then((s) => {
        if (s.hasSubscription && s.notificationHour !== null) {
          setEnabled(true);
          setHour(s.notificationHour);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function getOrCreateSubscription(): Promise<PushSubscription | null> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setPermissionDenied(true);
      return null;
    }

    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;

    return reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    });
  }

  async function handleEnable() {
    setSaving(true);
    setPermissionDenied(false);
    try {
      const subscription = await getOrCreateSubscription();
      if (!subscription) return;

      const subJson = subscription.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subJson, notificationHour: hour }),
      });
      if (res.ok) setEnabled(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDisable() {
    setSaving(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();

      await fetch("/api/push/subscribe", { method: "DELETE" });
      setEnabled(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleHourChange(newHour: number) {
    setHour(newHour);
    if (!enabled) return;

    setSaving(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;

      const subJson = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subJson, notificationHour: newHour }),
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className="px-5 py-3 border-b-2 border-(--gray-5)">
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-base font-black text-black">매출 입력 알림</p>
          <p className="text-xs text-(--gray-3)">오늘 미입력 시 알림 — Android PWA 전용</p>
        </div>
        <button
          onClick={enabled ? handleDisable : handleEnable}
          disabled={saving}
          className={`w-12 h-6 rounded-full transition-colors duration-200 relative shrink-0 ${
            enabled ? "bg-black" : "bg-(--gray-4)"
          } disabled:opacity-50`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
              enabled ? "translate-x-6" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {permissionDenied && (
        <p className="text-xs text-(--cal-sun) font-bold mt-1">
          알림 권한이 거부됐어요. 브라우저 설정에서 허용해주세요.
        </p>
      )}

      {enabled && (
        <div className="flex items-center gap-3 mt-2">
          <p className="text-sm font-bold text-(--gray-3) shrink-0">알림 시간</p>
          <select
            value={hour}
            onChange={(e) => handleHourChange(Number(e.target.value))}
            disabled={saving}
            className="flex-1 border-2 border-(--gray-4) focus:border-black px-3 py-1.5 text-base font-bold text-black bg-white focus:outline-none"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>{formatHour(h)}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
```

- [ ] 커밋

```bash
git add src/components/settings/NotificationSettings.tsx
git commit -m "feat: 알림 설정 UI 컴포넌트 추가"
```

---

### Task 9: 설정 페이지에 NotificationSettings 추가

**Files:**
- Modify: `src/app/(main)/settings/page.tsx`

- [ ] `settings/page.tsx` 전체 교체

```tsx
import GoalSettings from "@/components/settings/GoalSettings";
import MemoSearch from "@/components/settings/MemoSearch";
import DataManager from "@/components/settings/DataManager";
import NotificationSettings from "@/components/settings/NotificationSettings";

export default function SettingsPage() {
  return (
    <main className="h-full flex flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b-4 border-black px-5 pt-12 pb-4">
        <p className="text-sm font-bold text-(--gray-3) mb-1">매출 관리</p>
        <h1 className="text-4xl font-black text-black">설정</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <MemoSearch />
        <NotificationSettings />
        <GoalSettings />
        <DataManager />
      </div>
    </main>
  );
}
```

- [ ] 커밋

```bash
git add src/app/(main)/settings/page.tsx
git commit -m "feat: 설정 페이지에 알림 설정 추가"
```

---

### Task 10: Vercel Cron 설정

**Files:**
- Create: `vercel.json` (프로젝트 루트)

- [ ] `vercel.json` 생성

```json
{
  "crons": [
    {
      "path": "/api/push/cron",
      "schedule": "0 * * * *"
    }
  ]
}
```

> `0 * * * *` = 매시간 정각 실행 (UTC 기준).
> Vercel Pro 플랜이면 자동 실행됨. Hobby 플랜이라면 [cron-job.org](https://cron-job.org)에서 무료로 매시간 `GET https://<your-domain>/api/push/cron` 호출 + `Authorization: Bearer <CRON_SECRET>` 헤더 설정.

- [ ] 커밋 및 푸시

```bash
git add vercel.json
git commit -m "chore: Vercel Cron 설정 추가"
git push -u origin feat/push-notification
```

---

### Task 11: PR 생성 및 머지

- [ ] PR 생성

```bash
gh pr create \
  --title "feat: Android PWA 푸시 알림 (매출 미입력 리마인더)" \
  --body "설정 페이지에서 알림 시간을 지정하면, 해당 시간에 오늘 매출이 없을 경우 Android PWA로 푸시 알림을 발송합니다. Vercel Cron이 매시간 트리거하며, web-push 라이브러리로 발송합니다."
```

- [ ] PR 머지 → 브랜치 삭제
