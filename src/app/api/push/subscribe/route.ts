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

  if (error) return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
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

  if (error) return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
