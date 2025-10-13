import React from "react";
import { useLocation, Link } from "react-router";
import { Home, Settings } from "lucide-react";
// import { useTheme } from "./theme-provider";

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const location = useLocation();
  // const { theme, setTheme } = useTheme();
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <h1 className="text-xl font-bold text-center">오늘매출</h1>
      </header>
      <main className="flex-1 p-4 pb-20 flex flex-col justify-center items-center">
        {children}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg">
        <div className="flex justify-around p-2">
          <Link
            to="/"
            className={`flex flex-col flex-1 items-center p-2 rounded-md ${
              location.pathname === "/"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <Home size={24} />
            <span className="text-xs mt-1">메인</span>
          </Link>
          <Link
            to="/settings"
            className={`flex flex-col flex-1 items-center p-2 rounded-md ${
              location.pathname === "/settings"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <Settings size={24} />
            <span className="text-xs mt-1">설정</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
export default Layout;
