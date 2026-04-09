"use client";

import { useEffect, useRef } from "react";
import { useToastStore } from "@/store/toastStore";

export default function Toast() {
  const { message, hide } = useToastStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!message) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(hide, 2000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [message, hide]);

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-black text-white px-5 py-3 text-base font-black transition-all duration-200 ${
        message
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-2 pointer-events-none"
      }`}
    >
      {message}
    </div>
  );
}
