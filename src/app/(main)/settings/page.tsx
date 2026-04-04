import GoalSettings from "@/components/settings/GoalSettings";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#F5F3EE]">
      {/* 헤더 */}
      <div className="bg-[#1C2B3A] px-6 pt-14 pb-8">
        <p className="text-xs font-medium tracking-widest text-[#7A9BB5] uppercase mb-1">
          Settings
        </p>
        <p className="text-3xl font-bold text-white leading-none">설정</p>
      </div>

      {/* 설정 카드 영역 */}
      <div className="mx-4 -mt-4 space-y-3 pb-8">
        <GoalSettings />
      </div>
    </main>
  );
}
