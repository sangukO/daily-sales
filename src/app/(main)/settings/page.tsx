import GoalSettings from "@/components/settings/GoalSettings";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F0]">
      {/* 헤더 */}
      <div className="px-6 pt-14 pb-6">
        <p className="text-xs font-semibold tracking-[0.2em] text-[#9E8E7A] uppercase mb-3">
          Settings
        </p>
        <p className="font-(family-name:--font-playfair) text-3xl font-bold text-[#1C1208] leading-none">
          설정
        </p>
      </div>

      <div className="mx-6 border-t border-[#DDD3C2] mb-5" />

      {/* 설정 카드 영역 */}
      <div className="mx-4 space-y-3 pb-8">
        <GoalSettings />
      </div>
    </main>
  );
}
