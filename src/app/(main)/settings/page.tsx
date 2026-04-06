import GoalSettings from "@/components/settings/GoalSettings";
import MemoSearch from "@/components/settings/MemoSearch";

export default function SettingsPage() {
  return (
    <main className="h-full flex flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b-4 border-black px-5 pt-12 pb-4">
        <p className="text-sm font-bold text-(--gray-3) mb-1">매출 관리</p>
        <h1 className="text-4xl font-black text-black">설정</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <MemoSearch />
        <GoalSettings />
      </div>
    </main>
  );
}
