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
