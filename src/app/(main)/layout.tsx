import BottomNav from "@/components/layout/BottomNav";
import Toast from "@/components/layout/Toast";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <Toast />
      <div className="flex-1 overflow-hidden pb-[calc(4rem+env(safe-area-inset-bottom))]">{children}</div>
      <BottomNav />
    </div>
  );
}
