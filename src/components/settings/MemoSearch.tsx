"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Sale } from "@/types";

export default function MemoSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Sale[]>([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) { setResults([]); return; }

    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("sales")
          .select("*")
          .ilike("memo", `%${query.trim()}%`)
          .order("date", { ascending: false })
          .limit(50);
        if (error) throw error;
        setResults(data ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  return (
    <div className="px-5 py-3 border-b-2 border-(--gray-5)">
      {/* 검색창 */}
      <div className="border-2 border-black flex items-center px-3 gap-2 mb-2">
        <span className="text-base text-(--gray-3)">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="메모 검색..."
          className="flex-1 bg-white py-2 text-base text-black placeholder-(--gray-4) focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="검색어 지우기"
            className="text-(--gray-3) text-lg font-light"
          >
            ×
          </button>
        )}
      </div>

      {/* 결과 */}
      {query.trim() && (
        <div>
          {searching ? (
            <p className="text-sm text-(--gray-3) font-bold py-2">검색 중...</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-(--gray-3) font-bold py-2">검색 결과가 없습니다</p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {results.map((sale) => (
                <li key={sale.id} className="flex items-start gap-3 py-2 border-b border-(--gray-5)">
                  <span className="text-sm font-black text-black shrink-0 tabular-nums">
                    {sale.date}
                  </span>
                  <span className="text-sm font-bold text-(--gray-2) shrink-0 tabular-nums">
                    {sale.amount.toLocaleString("ko-KR")}원
                  </span>
                  <span className="text-sm text-(--gray-3) truncate">{sale.memo}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
