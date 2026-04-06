"use client";

import { useState, useRef } from "react";
import { getAllSales, upsertSale } from "@/lib/supabase/queries";

interface BackupData {
  version: number;
  exportedAt: string;
  sales: { date: string; amount: number; memo: string | null; is_holiday: boolean }[];
}

export default function DataManager() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; fail: number } | null>(null);
  const [exportError, setExportError] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setExporting(true);
    setExportError(false);
    try {
      const sales = await getAllSales();
      const backup: BackupData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        sales: sales.map((s) => ({
          date: s.date,
          amount: s.amount,
          memo: s.memo,
          is_holiday: s.is_holiday,
        })),
      };
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const today = new Date().toLocaleDateString("sv-SE");
      a.href = url;
      a.download = `daily-sales-backup-${today}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // 파일 input 초기화 (같은 파일 재선택 가능하도록)
    e.target.value = "";

    setImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const text = await file.text();
      const data: unknown = JSON.parse(text);

      if (
        typeof data !== "object" ||
        data === null ||
        !("version" in data) ||
        !("sales" in data) ||
        !Array.isArray((data as BackupData).sales)
      ) {
        setImportError("올바른 백업 파일이 아닙니다.");
        return;
      }

      const backup = data as BackupData;
      const total = backup.sales.length;
      let success = 0;
      let fail = 0;

      for (let i = 0; i < backup.sales.length; i++) {
        setImportProgress({ done: i, total });
        try {
          const s = backup.sales[i];
          await upsertSale({
            date: s.date,
            amount: s.amount,
            memo: s.memo,
            is_holiday: s.is_holiday ?? false,
          });
          success++;
        } catch {
          fail++;
        }
      }

      setImportProgress(null);
      setImportResult({ success, fail });
    } catch {
      setImportError("파일을 읽는 중 오류가 발생했습니다.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="px-5 py-5 border-t-2 border-(--gray-5)">
      <p className="text-xs font-black text-(--gray-3) mb-4 uppercase tracking-wide">데이터 관리</p>

      <div className="flex gap-3">
        {/* 내보내기 */}
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || importing}
          className="flex-1 border-2 border-black py-4 text-sm font-black active:bg-(--gray-5) disabled:opacity-40 transition-colors"
        >
          {exporting ? "내보내는 중..." : "JSON 내보내기"}
        </button>

        {/* 가져오기 */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing || exporting}
          className="flex-1 border-2 border-black py-4 text-sm font-black active:bg-(--gray-5) disabled:opacity-40 transition-colors"
        >
          {importing
            ? importProgress
              ? `가져오는 중... (${importProgress.done}/${importProgress.total})`
              : "처리 중..."
            : "JSON 가져오기"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />
      </div>

      {/* 에러/결과 피드백 */}
      {exportError && (
        <p className="mt-3 text-sm font-bold text-(--cal-sun)">내보내기에 실패했습니다.</p>
      )}
      {importError && (
        <p className="mt-3 text-sm font-bold text-(--cal-sun)">{importError}</p>
      )}
      {importResult && (
        <p className="mt-3 text-sm font-bold text-(--gray-2)">
          가져오기 완료 — 성공 {importResult.success}건
          {importResult.fail > 0 && `, 실패 ${importResult.fail}건`}
        </p>
      )}
    </div>
  );
}
