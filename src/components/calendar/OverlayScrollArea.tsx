"use client";

import { useEffect, useRef, type ReactNode } from "react";

export default function OverlayScrollArea({ children }: { children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<SVGSVGElement>(null);
  const thumbRef = useRef<SVGRectElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    const indicator = indicatorRef.current;
    const thumb = thumbRef.current;
    if (!viewport || !content || !indicator || !thumb) return;
    const header = content.querySelector<HTMLElement>("[data-scroll-header]");

    let frame = 0;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    function update() {
      if (!viewport || !indicator || !thumb) return;
      const { clientHeight, scrollHeight, scrollTop } = viewport;
      const headerHeight = header?.offsetHeight ?? 0;
      const dateViewportHeight = Math.max(0, clientHeight - headerHeight);
      const dateContentHeight = Math.max(1, scrollHeight - headerHeight);
      const overflow = scrollHeight - clientHeight;
      // 고정된 요일 헤더를 제외한 날짜 영역에만 막대를 표시합니다.
      const track = Math.max(0, dateViewportHeight - 8);
      const height = Math.min(track, Math.max(24, track * dateViewportHeight / dateContentHeight));
      const progress = overflow > 0 ? Math.min(1, Math.max(0, scrollTop / overflow)) : 0;
      thumb.setAttribute("height", String(height));
      thumb.setAttribute("y", String(headerHeight + 4 + progress * (track - height)));
      if (overflow <= 1) indicator.dataset.scrolling = "false";
    }

    function onScroll() {
      if (!viewport || !indicator) return;
      if (viewport.scrollHeight > viewport.clientHeight + 1) {
        indicator.dataset.scrolling = "true";
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (indicator) indicator.dataset.scrolling = "false";
      }, 800);
    }

    // 화면 회전이나 달력 행 수 변경에도 막대 위치와 길이를 갱신합니다.
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    observer.observe(content);
    if (header) observer.observe(header);
    viewport.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      observer.disconnect();
      viewport.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={viewportRef}
        className="calendar-scroll-viewport h-full overflow-y-auto focus-visible:outline-2 focus-visible:-outline-offset-2"
        tabIndex={0}
        role="region"
        aria-label="월간 달력"
      >
        <div ref={contentRef}>{children}</div>
      </div>
      <svg
        ref={indicatorRef}
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 z-20 h-full w-2 opacity-0 transition-opacity duration-300 data-[scrolling=true]:opacity-100 motion-reduce:transition-none"
        data-scrolling="false"
      >
        <rect ref={thumbRef} x="2" y="4" width="3.5" height="0" rx="1.75" fill="black" fillOpacity="0.35" />
      </svg>
    </div>
  );
}
