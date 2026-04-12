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
