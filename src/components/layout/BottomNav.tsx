"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "달력" },
  { href: "/chart",     label: "차트" },
  { href: "/settings",  label: "설정" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-4 border-black pb-[env(safe-area-inset-bottom)]">
      <ul className="flex h-16 items-stretch">
        {navItems.map(({ href, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                className={[
                  "flex flex-1 items-center justify-center text-xl font-black tracking-tight transition-colors",
                  isActive
                    ? "bg-black text-white"
                    : "text-(--gray-3) active:bg-(--gray-6)",
                ].join(" ")}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
